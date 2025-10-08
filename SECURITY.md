# Security Policies and Procedures

This document outlines security procedures and general policies for the RaceJS
project.

  * [Reporting a Bug](#reporting-a-bug)
  * [Disclosure Policy](#disclosure-policy)
  * [Comments on this Policy](#comments-on-this-policy)

## Reporting a Bug

The Resillix team takes all security bugs in RaceJS seriously.
Thank you for improving the security of RaceJS. We appreciate your efforts and
responsible disclosure and will make every effort to acknowledge your
contributions.

Report security bugs by emailing **security@resillix.com** or through our
[GitHub Security Advisories](https://github.com/resillix/racejs/security/advisories/new).

To ensure the timely response to your report, please ensure that the entirety
of the report is contained within the email body and not solely behind a web
link or an attachment.

The lead maintainer will acknowledge your email within 48 hours, and will send a
more detailed response within 48 hours indicating the next steps in handling
your report. After the initial reply to your report, the security team will
endeavor to keep you informed of the progress towards a fix and full
announcement, and may ask for additional information or guidance.

Report security bugs in third-party modules to the person or team maintaining
the module.

## Pre-release Versions

Alpha and Beta releases are unstable and **not suitable for production use**.
Vulnerabilities found in pre-releases should be reported according to the [Reporting a Bug](#reporting-a-bug) section.
Due to the unstable nature of the branch it is not guaranteed that any fixes will be released in the next pre-release.

## Disclosure Policy

When the security team receives a security bug report, they will assign it to a
primary handler. This person will coordinate the fix and release process,
involving the following steps:

  * Confirm the problem and determine the affected versions.
  * Audit code to find any potential similar problems.
  * Prepare fixes for all releases still under maintenance. These fixes will be
    released as fast as possible to npm.

## The RaceJS Threat Model

We are developing a comprehensive security model for RaceJS. As we maintain Express compatibility, 
we also follow security best practices from the Express.js ecosystem. Our security documentation 
will be published at [https://github.com/resillix/racejs/security](https://github.com/resillix/racejs/security).

## Comments on this Policy

If you have suggestions on how this process could be improved please submit a
pull request.
