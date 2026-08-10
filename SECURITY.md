# Security Policy

BIShare takes the privacy and security of its users seriously — the whole point
of the project is to move files safely.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Instead, email **security@billiongroup.net** (or **support@billiongroup.net**)
with:

- a description of the issue and its impact,
- steps to reproduce (a proof of concept if possible),
- any relevant URLs, requests, or logs.

We'll acknowledge your report as quickly as we can, keep you updated on the fix,
and credit you (if you'd like) once it's resolved. Please give us a reasonable
window to address the issue before any public disclosure.

## Scope

This repository is the **web client + marketing site**. Relevant areas include:

- the in-browser transfer flow (`/transfer`) and its client-side encryption,
- the rooms signaling / WebRTC paths,
- anything that could leak data or enable XSS/CSRF on bishare.app.

The transfer **API** and the native apps live in separate repositories
([bishare-flutter](https://github.com/BIShare-project/bishare-flutter),
[bishare-protocol](https://github.com/BIShare-project/bishare-protocol)); issues
there can be reported to the same address.

## How transfers are protected

Browser transfers are encrypted client-side with **AES-256-GCM** (WebCrypto).
The symmetric key is generated in the browser and carried only in the URL
fragment (`#k=…`), which browsers never transmit to the server — the relay
stores and forwards ciphertext only. Links auto-expire, and no account ties a
transfer to a user.
