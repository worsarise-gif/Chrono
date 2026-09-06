## 2024-05-24 - Missing OTP brute-force protection
**Vulnerability:** The OTP verification endpoint lacks attempt limits, making it susceptible to brute-force attacks.
**Learning:** We need to track attempt counts in the database to prevent attackers from repeatedly guessing the OTP.
**Prevention:** Implement an attempt counter using a transaction and delete the OTP document after a maximum number of failed attempts (e.g. 5).
