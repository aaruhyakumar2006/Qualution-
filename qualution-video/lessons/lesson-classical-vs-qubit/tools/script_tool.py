#!/usr/bin/env python3
"""
script_tool.py — CLI utility for inspecting and manipulating lesson script.json.

Supported commands:
  python script_tool.py get <file> <dot.path>
  python script_tool.py set <file> <dot.path> <value>
  python script_tool.py view <file> [--omit <comma,separated,fields>]
"""

import sys
import json
import argparse
from pathlib import Path


def parse_dot_path(data, path_str):
    """Traverse dot path in nested dict/list structure."""
    if not path_str:
        return data
    tokens = path_str.split('.')
    curr = data
    for token in tokens:
        if isinstance(curr, list):
            try:
                idx = int(token)
                curr = curr[idx]
            except (ValueError, IndexError) as e:
                raise KeyError(f"Invalid list index '{token}' in path '{path_str}'") from e
        elif isinstance(curr, dict):
            if token in curr:
                curr = curr[token]
            else:
                raise KeyError(f"Key '{token}' not found in path '{path_str}'")
        else:
            raise KeyError(f"Cannot traverse into scalar value at '{token}' in '{path_str}'")
    return curr


def set_dot_path(data, path_str, value):
    """Set value at dot path in nested dict/list structure."""
    tokens = path_str.split('.')
    curr = data
    for i, token in enumerate(tokens[:-1]):
        if isinstance(curr, list):
            idx = int(token)
            curr = curr[idx]
        elif isinstance(curr, dict):
            if token not in curr:
                next_token = tokens[i + 1]
                curr[token] = [] if next_token.isdigit() else {}
            curr = curr[token]

    last = tokens[-1]
    if isinstance(curr, list):
        idx = int(last)
        if idx == len(curr):
            curr.append(value)
        else:
            curr[idx] = value
    elif isinstance(curr, dict):
        curr[last] = value


def filter_omit(data, omit_keys):
    """Recursively filter out keys specified in omit_keys."""
    if isinstance(data, dict):
        return {
            k: filter_omit(v, omit_keys)
            for k, v in data.items()
            if k not in omit_keys
        }
    elif isinstance(data, list):
        return [filter_omit(item, omit_keys) for item in data]
    return data


def parse_value(val_str):
    """Attempt to parse value as JSON (int, float, bool, dict, list, null). Fallback to string."""
    try:
        return json.loads(val_str)
    except Exception:
        return val_str


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1].lower()

    if cmd == 'get':
        if len(sys.argv) < 4:
            print("Usage: python script_tool.py get <file> <dot.path>")
            sys.exit(1)
        file_path = Path(sys.argv[2])
        path_str = sys.argv[3]
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        try:
            val = parse_dot_path(data, path_str)
            if isinstance(val, (dict, list)):
                print(json.dumps(val, indent=2, ensure_ascii=False))
            else:
                print(val)
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)

    elif cmd == 'set':
        if len(sys.argv) < 5:
            print("Usage: python script_tool.py set <file> <dot.path> <value>")
            sys.exit(1)
        file_path = Path(sys.argv[2])
        path_str = sys.argv[3]
        val_str = " ".join(sys.argv[4:])
        parsed_val = parse_value(val_str)

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        try:
            set_dot_path(data, path_str, parsed_val)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write('\n')
            print(f"Updated '{path_str}' in {file_path}")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)

    elif cmd == 'view':
        parser = argparse.ArgumentParser(prog='script_tool.py view')
        parser.add_argument('command')
        parser.add_argument('file')
        parser.add_argument('--omit', default='', help='Comma-separated field names to omit')
        args = parser.parse_args(sys.argv[1:])

        file_path = Path(args.file)
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        omit_keys = set(k.strip() for k in args.omit.split(',') if k.strip())
        filtered = filter_omit(data, omit_keys)
        print(json.dumps(filtered, indent=2, ensure_ascii=False))

    else:
        print(f"Unknown command '{cmd}'. Supported: get, set, view")
        sys.exit(1)


if __name__ == '__main__':
    main()
