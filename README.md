GitHub Pages Safe POC Demo
==========================

Files:
- index.html : simple page that includes exp.js
- exp.js     : BENIGN testing script that fetches /ePay/EditProfile.do and logs extracted input fields to the browser console.

Purpose:
- This repository is intended for safe, authorized testing in lab environments only.
- The script does NOT exfiltrate data externally. It only logs to the browser console.

How to deploy on GitHub Pages:
1. Create a new GitHub repository (e.g., xss-poc-demo).
2. Add these three files to the repository (commit and push).
3. In the repository settings -> Pages, choose branch 'main' (or 'master') and folder '/ (root)'.
4. Save; GitHub will provide a URL like: https://<your-username>.github.io/xss-poc-demo/
5. Visit that URL in a browser on a test system. Open Developer Tools -> Console to see the logged output.

Notes:
- Use only against systems you are authorized to test.
- If your target enforces CSP that blocks external scripts, you may need to host the script on a domain allowed by the target (only in authorized tests).
- For collaboration tools (Burp Collaborator, xsshunter), use those platforms rather than external exfiltration.
