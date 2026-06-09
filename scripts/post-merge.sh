#!/bin/bash
set -e

# Project Firefly is a static HTML site served by serve.py.
# There are no dependencies to install or migrations to run.
# Validate that the dev server script still parses so merges fail loudly
# if it ever gets broken.
python -c "import ast; ast.parse(open('serve.py').read())"

echo "Post-merge setup complete: static site, no build required."
