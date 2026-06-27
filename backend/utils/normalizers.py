def normalize_list(x):
    if isinstance(x, list):
        return x
    return []

def normalize_dict(x):
    if isinstance(x, dict):
        return x
    return {}

def normalize_string(x):
    if x is None:
        return ""
    return str(x)

def normalize_int(x):
    if x is None:
        return 0
    try:
        return int(x)
    except:
        return 0

def normalize_float(x):
    if x is None:
        return 0.0
    try:
        return float(x)
    except:
        return 0.0
