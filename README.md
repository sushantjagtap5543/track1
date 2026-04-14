# 🛰️ GeoSurePath Platform v2.0
> **Production-Grade Tracking & Fleet Management Ecosystem**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![System Status](https://img.shields.io/badge/Status-Stable-success)](http://localhost/api/status)
[![Version](https://img.shields.io/badge/Version-2.0.0-orange)](https://github.com/geosurepath/track1)

GeoSurePath is an enterprise-grade tracking and fleet management platform built on a hardened **Traccar** core. It has been meticulously refactored to eliminate technical friction, enhance security, and scale autonomously.

---

## 🏗 High-Level Architecture

GeoSurePath employs a modular, microservices-oriented architecture designed for resilience and performance.

```text
                                  ┌───────────────────┐
                                  │      Nginx        │
                                  │ (Hardened Proxy)  │
                                  └─────────┬─────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
          ┌─────────▼─────────┐                           ┌─────────▼─────────┐
          │    Traccar Core   │                           │     SaaS API      │
          │ (Java 21 / Netty) │                           │  (Node.js/Prisma) │
          └─────────┬─────────┘                           └─────────┬─────────┘
                    │                                               │
                    └───────────────────────┬───────────────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │         PostgreSQL        │
                              │     (Multi-Tenant DB)     │
                              └─────────────┬─────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │           Redis           │
                              │       (Cache/Jobs)        │
                              └───────────────────────────┘
```

## 🌟 Key Features

- **🛡️ Hardened Security**: Reverse proxy with SSL stubs, Zod request validation, and JWT-based MFA.
- **🤖 AI Self-Healing**: Integrated health monitoring that auto-corrects database drift and triggers cloud backups.
- **⚡ Quantum Scaling**: High-concurrency Netty core capable of handling thousands of devices with minimal latency.
- **📊 Business Intelligence**: Built-in SaaS API for complex billing, user management, and advanced reporting.
- **🛠️ Unified CLI**: A single entry point for all management tasks—from deployment to audits.

---

## 🚀 Quick Start

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- Bash-compatible shell (for CLI tools)

### Deployment in 3 Minutes
1. **Initialize Environment**:
   ```bash
   cp .env.example .env
   # Update .env with your specific credentials
   ```

2. **Launch the Stack**:
   ```bash
   ./scripts/geosure.sh up
   ```

3. **Verify Health**:
   Visit `http://localhost/api/status` to view the **Anti-Gravity Status Dashboard**.

---

## 🛠 Management CLI (`geosure.sh`)

The unified CLI provides a friction-less experience for operators:

| Command | Description |
| :--- | :--- |
| `up` | Start the entire stack in detached mode |
| `down` | Shut down all services |
| `logs` | Stream logs from all components |
| `build` | Rebuild service images |
| `doctor` | Self-healing diagnostic tool for environment issues |
| `migrate` | Run Prisma database migrations |
| `seed` | Populate initial system data |

---

---

## 📡 Device Port Map

Configure your tracking devices to point to the following ports on your server's IP/domain:

| Protocol / Device | Port | Standard For |
| :--- | :--- | :--- |
| **GPS103** | `5001` | Coban, various generic |
| **TK103** | `5002` | Zhy, various generic |
| **Queclink** | `5003` | GV series |
| **H02** | `5013` | Various Chinese trackers |
| **GL200** | `5020` | Queclink GL series |
| **GT06** | `5023` | Concert, various generic |
| **Teltonika** | `5027` | FMB series, etc. |
| **Ruptela** | `5046` | Eco4, etc. |
| **OsMand** | `5055` | Mobile tracking (HTTP) |
| **Atlanta (L100)** | `5064` | Atlanta Systems devices |
| **AIS 140 (ITS)** | `5180` | AIS 140 compliant (ITS) |

---

## ⚙️ Deployment Best Practices

### 1. Network & Firewall
- **Traffic**: Ensure ports mapping to your devices (e.g., 5023, 5027) are open for both **TCP and UDP**.
- **Web UI**: Access is proxied through Nginx on ports 80/443. External access to port 8082 (Traccar) or 3001 (SaaS API) should be restricted.

### 2. Environment Configuration
- **Database**: Ensure `POSTGRES_PASSWORD` is changed in `.env`.
- **Memory**: The platform is tuned for 10k devices; ensure the host has at least 8GB RAM for stable performance under load.

### 3. Verification & Scaling
- Use `./scripts/geosure.sh doctor` to check for environment drift.
- Logs are found in `./logs/traccar/wrapper.log.YYYYMMDD` for protocol debugging.

---

## 📖 Documentation & Links

- **[Developer Onboarding Guide](ONBOARDING.md)**: Deep-dive into architecture, local setup, and contributing.
- **[API Reference](http://localhost:3001/api-docs)**: Interactive Swagger documentation for the SaaS API.
- **[Audit Reports](ULTIMATE_HANDOVER.md)**: Latest security and performance hardening audit results.

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.