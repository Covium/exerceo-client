#!/usr/bin/env sh
set -eu

mode="${1:-patch}"

git fetch --tags --force >/dev/null 2>&1 || true
latest="$(git tag -l 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1 || true)"

if [ -z "$latest" ]; then
  major=0
  minor=1
  patch=0
else
  ver="${latest#v}"
  major="${ver%%.*}"
  rest="${ver#*.}"
  minor="${rest%%.*}"
  patch="${rest#*.}"
fi

if [ "$mode" != "current" ]; then
  if [ -z "$latest" ] && [ "$mode" = "patch" ]; then
    : # first release stays 0.1.0 to match the in-repo baseline
  else
    case "$mode" in
      major)
        major=$((major + 1))
        minor=0
        patch=0
        ;;
      minor)
        minor=$((minor + 1))
        patch=0
        ;;
      patch)
        patch=$((patch + 1))
        ;;
      *)
        echo "Unknown mode: $mode" >&2
        exit 1
        ;;
    esac
  fi
fi

version="$major.$minor.$patch"
code=$((major * 1000000 + minor * 1000 + patch))

echo "version=$version"
echo "tag=v$version"
echo "code=$code"
