"""
ECG inference service.

Signal is split into fixed 5-second segments (1800 samples @ 360 Hz).
Each segment is classified independently and tagged with a relative
(start_seconds/end_seconds) and absolute (start_timestamp/end_timestamp)
time so an abnormality can be located precisely on the recording.
"""
import io
from datetime import datetime, timedelta, timezone
from typing import Union

import numpy as np
import pandas as pd

from config import settings

SAMPLING_RATE = 360
SEGMENT_SECONDS = 5
WINDOW_SIZE = SAMPLING_RATE * SEGMENT_SECONDS  # 1800

CLASS_NAMES = [
    "Normal", "Supraventricular", "Ventricular", "Conduction Disorder",
    "Myocardial Infarction", "Hypertrophy", "Ischemia/ST-T", "Atrial Fibrillation",
]
NORMAL_LABEL = "Normal"
WEIGHTS = {"resnet": 0.45, "inception": 0.35, "transformer": 0.20}

_models: dict | None = None


def _get_models():
    global _models
    if _models is not None:
        return _models

    import os
    import tensorflow as tf

    @tf.keras.utils.register_keras_serializable()
    class PositionalEncoding(tf.keras.layers.Layer):
        def call(self, x):
            seq_len = tf.shape(x)[1]
            d_model = tf.shape(x)[2]
            pos = tf.range(seq_len, dtype=tf.float32)[:, None]
            dim = tf.range(d_model, dtype=tf.float32)[None, :]
            angle = pos / tf.pow(10000.0, (2 * (dim // 2)) / tf.cast(d_model, tf.float32))
            even = tf.cast(tf.math.floormod(dim, 2) == 0, tf.float32)
            odd = 1 - even
            encoding = tf.sin(angle) * even + tf.cos(angle) * odd
            return x + encoding[None, :, :]

    custom_objects = {"PositionalEncoding": PositionalEncoding}
    files = {
        "resnet": settings.ECG_RESNET_PATH,
        "inception": settings.ECG_INCEPTION_PATH,
        "transformer": settings.ECG_TRANSFORMER_PATH,
    }

    _models = {}
    for name, path in files.items():
        if not os.path.exists(path):
            print(f"[ECG] Skipping {name} — not found: {path}")
            continue
        _models[name] = tf.keras.models.load_model(path, custom_objects=custom_objects)
        print(f"[ECG] Loaded {name}")

    return _models


def _preprocess(signal: np.ndarray) -> np.ndarray:
    from scipy.signal import butter, filtfilt, iirnotch
    nyq = 0.5 * SAMPLING_RATE
    low = 0.5 / nyq
    high = min(45.0 / nyq, 0.99)
    b, a = butter(3, [low, high], btype="bandpass")
    signal = filtfilt(b, a, signal)
    w0 = 50.0 / nyq
    if w0 < 1.0:
        bn, an = iirnotch(w0, 30)
        signal = filtfilt(bn, an, signal)
    signal = (signal - np.mean(signal)) / (np.std(signal) + 1e-8)
    return signal.astype(np.float32)


def _parse_recording_start(value: Union[str, datetime, None]) -> datetime | None:
    """Parse a clock time. Accepts datetime, ISO 8601, or HH:MM[:SS] (today)."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    s = str(value).strip()
    # Try ISO 8601 first (supports "2026-06-05T14:30:00", with or without TZ)
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        pass
    # Fallback: HH:MM or HH:MM:SS — anchor to today's date
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            t = datetime.strptime(s, fmt).time()
            today = datetime.now().date()
            return datetime.combine(today, t)
        except ValueError:
            continue
    raise ValueError(
        f"Could not parse recording_start_time={value!r}. "
        "Use ISO 8601 (2026-06-05T14:30:00) or HH:MM[:SS]."
    )


def _fmt_clock(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    # Drop microseconds for a clean HH:MM:SS-style ISO stamp
    return dt.replace(microsecond=0).isoformat()


def predict(
    csv_bytes: bytes,
    recording_start_time: Union[str, datetime, None] = None,
) -> dict:
    try:
        loaded = _get_models()
    except ModuleNotFoundError as e:
        raise RuntimeError(
            "ECG analysis requires TensorFlow. "
            "Free up disk space then run: pip install tensorflow --no-cache-dir"
        ) from e
    if not loaded:
        raise RuntimeError("No ECG models loaded")

    start_dt = _parse_recording_start(recording_start_time)

    df = pd.read_csv(io.BytesIO(csv_bytes), comment="#", header=None)
    col = pd.to_numeric(df.iloc[:, -1], errors="coerce").dropna()
    signal = col.values.astype(np.float32)

    total_samples = int(len(signal))
    total_duration_seconds = total_samples / SAMPLING_RATE

    n_segments = total_samples // WINDOW_SIZE
    if n_segments == 0:
        raise ValueError(
            f"Signal too short ({total_samples} samples ≈ {total_duration_seconds:.2f}s). "
            f"Need at least {WINDOW_SIZE} samples ({SEGMENT_SECONDS}s)."
        )

    discarded_samples = total_samples - n_segments * WINDOW_SIZE
    discarded_seconds = discarded_samples / SAMPLING_RATE

    # One (n_segments, WINDOW_SIZE, 1) batch, each model called exactly once.
    windows = np.stack([
        _preprocess(signal[i * WINDOW_SIZE: (i + 1) * WINDOW_SIZE])
        for i in range(n_segments)
    ]).reshape(n_segments, WINDOW_SIZE, 1)

    per_model_probs = {k: loaded[k](windows, training=False).numpy() for k in loaded}
    ensemble_per_segment = sum(WEIGHTS[k] * per_model_probs[k] for k in per_model_probs)

    segment_top_idx = ensemble_per_segment.argmax(axis=1)
    segment_conf = ensemble_per_segment.max(axis=1)

    segments: list[dict] = []
    abnormalities_timeline: list[dict] = []
    for i in range(n_segments):
        start_s = i * SEGMENT_SECONDS
        end_s = start_s + SEGMENT_SECONDS
        seg_start_clock = start_dt + timedelta(seconds=start_s) if start_dt else None
        seg_end_clock = start_dt + timedelta(seconds=end_s) if start_dt else None
        label = CLASS_NAMES[int(segment_top_idx[i])]
        conf = float(segment_conf[i])

        seg = {
            "segment": i + 1,
            "start_seconds": start_s,
            "end_seconds": end_s,
            "start_timestamp": _fmt_clock(seg_start_clock),
            "end_timestamp": _fmt_clock(seg_end_clock),
            "prediction": label,
            "confidence": round(conf, 4),
        }
        segments.append(seg)
        if label != NORMAL_LABEL:
            abnormalities_timeline.append(seg)

    avg = ensemble_per_segment.mean(axis=0)
    top_idx = int(np.argmax(avg))
    segment_agreement = float((segment_top_idx == top_idx).mean())
    confidence_variance = float(segment_conf.var())

    return {
        "prediction": CLASS_NAMES[top_idx],
        "confidence": round(float(avg[top_idx]), 4),
        "class_probabilities": {CLASS_NAMES[i]: round(float(avg[i]), 4) for i in range(len(CLASS_NAMES))},
        "segments": segments,
        "total_segments": n_segments,
        "segment_seconds": SEGMENT_SECONDS,
        "sampling_rate": SAMPLING_RATE,
        "recording_duration_seconds": round(total_duration_seconds, 3),
        "analyzed_duration_seconds": n_segments * SEGMENT_SECONDS,
        "discarded_tail_seconds": round(discarded_seconds, 3),
        "recording_start_time": _fmt_clock(start_dt),
        "recording_end_time": _fmt_clock(
            start_dt + timedelta(seconds=n_segments * SEGMENT_SECONDS) if start_dt else None
        ),
        "abnormalities_timeline": abnormalities_timeline,
        "segment_agreement": round(segment_agreement, 4),
        "confidence_variance": round(confidence_variance, 6),
    }
