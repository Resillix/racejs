Archive notice
================

This repository contains a curated set of documentation and examples. Some older or development-only materials were moved to `archive/` to keep the main tree focused and easy to consume.

Why archived
------------
- Large or fragile dev-mode demos that are not maintained and can break local builds.
- Historical planning documents and intermediate notes that clutter documentation.

How to restore
--------------
If you need a file from `archive/` back into the main tree:

1. Run: `git mv archive/path/to/file path/to/destination`
2. Commit with a message explaining why it's restored.

If a file was removed but you want the original history preserved, use `git mv` instead of copying.
