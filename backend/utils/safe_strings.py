def safe_str(value):
    if value is None:
        return ""
    return str(value)

def safe_lower(value):
    if value is None:
        return ""
    return str(value).lower()

def safe_upper(value):
    if value is None:
        return ""
    return str(value).upper()

def safe_strip(value):
    if value is None:
        return ""
    return str(value).strip()

def safe_split(value, sep=None):
    if value is None:
        return []
    return str(value).split(sep)

def safe_replace(value, old, new):
    if value is None:
        return ""
    return str(value).replace(old, new)

def safe_startswith(value, prefix):
    if value is None:
        return False
    return str(value).startswith(prefix)

def safe_endswith(value, suffix):
    if value is None:
        return False
    return str(value).endswith(suffix)
