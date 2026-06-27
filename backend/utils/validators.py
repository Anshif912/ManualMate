def ensure_string(value):
    if value is None:
        return ""
    return str(value)

def ensure_int(value, default=0):
    if value is None:
        return default
    try:
        return int(value)
    except:
        return default

def ensure_float(value, default=0.0):
    if value is None:
        return default
    try:
        return float(value)
    except:
        return default

def ensure_list(value):
    if isinstance(value, list):
        return value
    return []

def ensure_dict(value):
    if isinstance(value, dict):
        return value
    return {}

def ensure_bool(value):
    return bool(value)
