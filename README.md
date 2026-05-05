# 🛠️ Biometric Hardware Integration Guide

This guide explains how to connect physical biometric terminals (like ZKTeco, eSSL, or generic ADMS devices) to your Universal Biometric Framework. 

We will break this down into **phases**, so you can follow step-by-step from unboxing the device to receiving attendance data on your server.

---

## Phase 1: Physical Device Setup
Before the device can talk to the server, it must be connected to the internet and told *where* to send its data.

### Step 1: Connect to the Network
1. Go to the physical device's menu (usually by pressing `M/OK`).
2. Navigate to **Network > Ethernet** or **Wi-Fi**.
3. Enable **DHCP** or set a **Static IP** so the device connects to the internet.

### Step 2: Configure Cloud Server Settings (ADMS)
The device needs to know your server's address to push data.
1. Navigate to **Network > Cloud Server Settings** (sometimes called **ADMS**).
2. Set **Enable Domain Name** to `OFF` (unless using a domain).
3. Set **Server Address** to the IP of your backend server (e.g., `192.168.1.100` or `your-server.com`).
4. Set **Server Port** to `8080` (or whatever port your backend runs on).
5. (Important) Note down the **Device Serial Number (SN)** from the **System Info** menu.

---

## Phase 2: Registering the Device in HRMS
Your server will reject data from unknown devices. You must register the device to generate an API key.

### Step 1: Add Device
1. Open the HRMS Web Dashboard.
2. Go to **Attendance Hub > Biometric Devices**.
3. Click **+ Add Device**.

### Step 2: Fill Details
1. **Device Identifier**: Enter the exact Serial Number (e.g., `SN99999`) you found in Phase 1.
2. **Vendor Format**: Select `ZKTECO` (or `GENERIC`).
3. Save the device.

### Step 3: Get the API Key
After saving, the system will show a **Tenant API Key** (e.g., `ak_157e5f8e30...`). 
*Note: Any bridge software or agent connecting this device to the cloud must send this key in the `X-API-KEY` header for security.*

---

## Phase 3: Employee Enrollment & Mapping
The physical device only knows users by an ID number (like "User 1"). We must tell the system that "User 1" is "Ravi Kumar".

### Step 1: Enroll on Device
1. Go to the physical device.
2. Navigate to **User Management > New User**.
3. The device will assign an ID (e.g., `101`). 
4. Register the employee's fingerprint or face and save.

### Step 2: Map in HRMS
1. Go to the HRMS Dashboard.
2. Navigate to **Attendance Hub > Employee Mappings**.
3. Click **+ New Mapping**.
4. Select the Employee: **Ravi Kumar**.
5. Select the Target Device: The device registered in Phase 2.
6. Enter the **Biometric ID**: `101`.
7. Click **Link Employee**.

---

## Phase 4: Understanding the API & Data Flow
When an employee punches in, how does the data get to the system? 

Our system uses a **JSON REST API**. If you are building a bridge software (an agent) to pull data from a BioTime server or directly from SDKs, here is exactly what your agent must send to our server.

### Example 1: Sending an Attendance Punch (Check-In / Check-Out)
When an employee scans, send a `POST` request to `/api/biometric-punch`.

**Endpoint**: `POST http://your-server:8080/api/biometric-punch`  
**Headers**:
- `Content-Type: application/json`
- `X-API-KEY: <Your_Tenant_API_Key>`

**JSON Request Body**:
```json
{
  "sn": "SN99999",                 
  "deviceIdentifier": "SN99999",    
  "biometricIdentifier": "101",     
  "punchTime": "2026-05-05T09:00:00"
}
```
*Explanation of fields:*
- `sn` and `deviceIdentifier`: The serial number of the machine (tells us which tenant/device this belongs to).
- `biometricIdentifier`: The User ID from the machine (`101`).
- `punchTime`: The exact time the person scanned.

**JSON Response (Success)**:
```json
{
  "status": "success",
  "message": "Punch recorded for Ravi Kumar",
  "checkIn": "09:00",
  "checkOut": "N/A"
}
```
*Note: The server automatically handles whether this is a Check-In or Check-Out based on the time of day.*

---

### Example 2: Agent Heartbeat (Status Update)
If you are running a local "Sync Agent" on a computer, it should ping the server periodically to say "I am online" and ask for any pending commands (like remotely rebooting a device).

**Endpoint**: `POST http://your-server:8080/api/biometric/agent/heartbeat`  
**Headers**:
- `Content-Type: application/json`
- `X-API-KEY: <Your_Tenant_API_Key>`

**JSON Request Body**:
```json
{
  "agentName": "Delhi-Office-Bridge",
  "version": "1.0.1"
}
```

**JSON Response (Success)**:
```json
{
  "status": "success",
  "serverTime": "2026-05-05T10:30:00",
  "commands": [] 
}
```
*(If there are commands like `REBOOT`, they will appear in the `commands` array).*

---

## Troubleshooting Guide

| Scenario | What Happened? | How to Fix |
| :--- | :--- | :--- |
| **HTTP 403 Forbidden** | The server rejected the request. | Ensure the `X-API-KEY` header is correct and matches the one in the Biometric Devices tab. |
| **HTTP 500 Internal Error** | Device SN not found in DB. | Ensure the `"sn"` in your JSON matches the Device Identifier in the HRMS exactly. |
| **Punch Success, but no name**| The Biometric ID isn't mapped. | Go to Employee Mappings and ensure ID `101` is mapped to an employee for that specific device. |
