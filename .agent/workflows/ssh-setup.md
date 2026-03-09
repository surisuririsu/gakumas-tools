---
description: SSH Passwordless Setup Guide
---

# SSH Passwordless Login Setup

Run these steps on the **Client Machine** (the one you are connecting *from*).

## 1. Generate SSH Key (if not exists)
Check if you already have a key:
```bash
ls ~/.ssh/id_ed25519.pub
```
If it does not exist, generate one (press Enter for all prompts):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

## 2. Copy Key to Server
Replace `user` and `hostname` with the target machine's info (e.g., `shigehiro@192.168.100.23`).

**Method A: Using ssh-copy-id (Recommended)**
```bash
ssh-copy-id user@hostname
```

**Method B: Manual Copy (If ssh-copy-id is missing)**
```bash
cat ~/.ssh/id_ed25519.pub | ssh user@hostname "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

## Verification
Try logging in. It should not ask for a password:
```bash
ssh user@hostname
```
