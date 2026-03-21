# Security Policy

## Supported Versions

| Version | Status | Security |
|---------|--------|----------|
| 0.1.0 | ✅ Current MVP | 100% Local, No External APIs |
| 0.2.0+ | 🔜 Planned | Will introduce optional AI features |

---

## Security Overview

### v0.1.0 MVP - Current Version

**Storage:**
- ✅ 100% local file system (`~/.memory-os/data/`)
- ✅ No cloud storage
- ✅ No external database connections
- ✅ Plain JSON format (human-readable)

**Network:**
- ✅ Zero external API calls
- ✅ No telemetry or analytics
- ✅ No update checks
- ✅ Completely offline-capable

**Authentication:**
- ✅ No API keys required
- ✅ No user accounts
- ✅ Local file system permissions only

**Data Collection:**
- ✅ Manual trigger only
- ✅ No automatic background scanning
- ✅ User controls all collection operations
- ✅ Explicit file paths required

---

## Security Best Practices

### 1. Test in Isolated Environment

```bash
# Create a test user or use a VM
sudo useradd -m testuser
sudo su - testuser

# Install and test
npm install -g openclaw-memory-os
openclaw-memory-os init

# Test with safe data
mkdir ~/test-data
echo "test content" > ~/test-data/test.txt
openclaw-memory-os collect --source ~/test-data/
```

### 2. Inspect Data Before Collection

```bash
# Check what files will be collected
ls -la ~/target-directory/

# Review file contents
cat ~/target-directory/*.txt

# Then collect
openclaw-memory-os collect --source ~/target-directory/
```

### 3. Audit Collected Data

```bash
# List all memories
ls -la ~/.memory-os/data/memories/

# Inspect memory content
cat ~/.memory-os/data/memories/*.json | jq '.'

# Check index
cat ~/.memory-os/data/index.json | jq '.'
```

### 4. Verify Network Activity

```bash
# Monitor network during operation (should be ZERO)
# Terminal 1:
sudo tcpdump -i any -n 'port 443 or port 80'

# Terminal 2:
openclaw-memory-os collect --source ~/test-data/

# Expected: No network packets
```

### 5. Secure File Permissions

```bash
# Recommended permissions
chmod 700 ~/.memory-os
chmod 600 ~/.memory-os/data/memories/*.json
chmod 600 ~/.memory-os/config.json

# Verify
ls -la ~/.memory-os
```

---

## Privacy Considerations

### What Memory-OS Collects

**Only what you explicitly tell it to collect:**
- Text content from specified files
- Metadata you provide (tags, source, context)
- Timestamps (local system time)

**What Memory-OS does NOT collect:**
- ❌ System information
- ❌ User behavior
- ❌ Browsing history (unless explicitly collected)
- ❌ Passwords or credentials
- ❌ Email or messages (unless explicitly collected)
- ❌ Location data
- ❌ Usage analytics

### Data Retention

**Where data is stored:**
```
~/.memory-os/
├── config.json       # Configuration
├── data/
│   ├── memories/     # Individual memory files (JSON)
│   ├── indexes/      # Search indexes (local)
│   └── index.json    # Master index
└── logs/             # Operation logs (optional)
```

**How long data is kept:**
- Forever (until you delete it)
- No automatic deletion
- No expiration policy
- User is in full control

**How to delete data:**
```bash
# Delete specific memory
rm ~/.memory-os/data/memories/<memory-id>.json

# Delete all data
rm -rf ~/.memory-os/

# Uninstall completely
npm uninstall -g openclaw-memory-os
rm -rf ~/.memory-os/
```

---

## Sensitive Data Handling

### ⚠️ DO NOT Collect:

1. **Credentials**
   - Passwords
   - API keys
   - Tokens
   - SSH keys

2. **Personal Information**
   - Social Security Numbers
   - Credit card numbers
   - Bank account details
   - Medical records (unless explicitly intended)

3. **Proprietary Data**
   - Company secrets
   - Intellectual property
   - Customer data (unless authorized)

### Exclusion Patterns

Configure exclusions in `~/.memory-os/config.json`:

```json
{
  "collectors": {
    "exclude": [
      "**/.env",
      "**/.env.*",
      "**/id_rsa",
      "**/id_ed25519",
      "**/*.pem",
      "**/*password*",
      "**/*secret*",
      "**/*.key",
      "**/credentials.json",
      "**/node_modules",
      "**/.git"
    ]
  }
}
```

---

## Future Versions (v0.2.0+)

### Planned AI Features

**When implemented, these will require external APIs:**

1. **Semantic Search**
   - Requires: OpenAI or Anthropic API key
   - Data sent: Memory content for embedding generation
   - Stored: Embeddings (locally)

2. **LLM-powered Insights**
   - Requires: OpenAI or Anthropic API key
   - Data sent: Memory summaries for analysis
   - Stored: Insights (locally)

3. **Knowledge Graph**
   - Requires: OpenAI or Anthropic API key
   - Data sent: Memory relationships for extraction
   - Stored: Graph data (locally)

### Security Measures for Future Versions

1. **Explicit Consent**
   - API features opt-in only
   - User must explicitly enable and configure
   - Clear warning before first API call

2. **Local-Only Mode**
   - Option to disable all external APIs
   - Fallback to basic local search
   - No degraded functionality for core features

3. **Data Encryption**
   - At-rest encryption for sensitive memories
   - Optional encryption key
   - Encrypted before API transmission

4. **API Audit Log**
   - Log all external API calls
   - Track what data was sent
   - User can review and disable

---

## Reporting a Vulnerability

If you discover a security vulnerability in Memory-OS:

### Report Channels

1. **GitHub Security Advisory**
   - https://github.com/ZhenRobotics/openclaw-memory-os/security/advisories/new

2. **Email**
   - security@openclaw.ai (if available)

3. **GitHub Issues**
   - For non-critical issues: https://github.com/ZhenRobotics/openclaw-memory-os/issues

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information (optional)

### Response Time

- **Critical**: Within 24 hours
- **High**: Within 72 hours
- **Medium**: Within 1 week
- **Low**: Within 2 weeks

---

## Security Checklist for Users

Before using Memory-OS in production:

- [ ] Test in isolated environment (VM or test user)
- [ ] Review source code (it's open source)
- [ ] Verify npm package contents match GitHub
- [ ] Check for network activity (should be zero for v0.1.0)
- [ ] Audit collected data location and contents
- [ ] Configure file exclusion patterns
- [ ] Set appropriate file permissions
- [ ] Understand data retention and deletion
- [ ] Review this security policy
- [ ] Decide if AUTO-TRIGGER is appropriate for your use case

---

## Threat Model

### Threats v0.1.0 Protects Against

- ✅ Unauthorized remote access (no network)
- ✅ Data exfiltration to third parties (100% local)
- ✅ Vendor lock-in (open format, local files)
- ✅ Service shutdown (no cloud dependency)

### Threats Users Must Protect Against

- ⚠️ Local file system access (standard file permissions)
- ⚠️ Malware on local system
- ⚠️ Physical access to machine
- ⚠️ Backup security (encrypt backups)
- ⚠️ Accidental data collection (review before collect)

### Threats for Future Versions (with AI)

- ⚠️ API key leakage
- ⚠️ Data sent to external APIs
- ⚠️ Third-party API provider security
- ⚠️ Man-in-the-middle attacks
- (Will be addressed with encryption and local-only mode)

---

## Compliance

### Data Protection Regulations

**v0.1.0 Compliance:**
- ✅ **GDPR**: User has full control, local storage, no processing by us
- ✅ **CCPA**: No personal data collection by service provider
- ✅ **HIPAA**: Can be used for PHI if proper file permissions set
- ✅ **SOC 2**: N/A (no service provider, local only)

**Note:** Users are responsible for compliance when collecting and storing data.

---

## License

This security policy is part of openclaw-memory-os, licensed under MIT-0.

---

**Last Updated:** 2026-03-21
**Version:** 0.1.0
**Status:** Current
