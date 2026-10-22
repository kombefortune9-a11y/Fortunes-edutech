import os
import sys
import zipfile
import hashlib
import base64
import subprocess
import tempfile

def sign_apk(in_apk, out_apk, key_path, cert_path):
    if not os.path.exists(in_apk):
        print(f"Error: {in_apk} does not exist")
        sys.exit(1)
    
    with zipfile.ZipFile(in_apk, 'r') as zin:
        files = {}
        for item in zin.infolist():
            if not item.filename.startswith('META-INF/'):
                files[item.filename] = zin.read(item.filename)
    
    # 1. Create MANIFEST.MF with SHA1
    manifest_lines = ['Manifest-Version: 1.0', 'Created-By: 1.0 (Android Signer)', '']
    file_digests = {}
    for fname in sorted(files.keys()):
        data = files[fname]
        sha1 = base64.b64encode(hashlib.sha1(data).digest()).decode('ascii')
        file_digests[fname] = sha1
        manifest_lines.append(f'Name: {fname}')
        manifest_lines.append(f'SHA1-Digest: {sha1}')
        manifest_lines.append('')
    manifest_content = '\r\n'.join(manifest_lines).encode('utf-8')
    
    # 2. Create CERT.SF
    sf_lines = [
        'Signature-Version: 1.0',
        'Created-By: 1.0 (Android Signer)',
        f'SHA1-Digest-Manifest: {base64.b64encode(hashlib.sha1(manifest_content).digest()).decode("ascii")}',
        ''
    ]
    for fname in sorted(files.keys()):
        entry_text = f'Name: {fname}\r\nSHA1-Digest: {file_digests[fname]}\r\n\r\n'.encode('utf-8')
        entry_digest = base64.b64encode(hashlib.sha1(entry_text).digest()).decode('ascii')
        sf_lines.append(f'Name: {fname}')
        sf_lines.append(f'SHA1-Digest: {entry_digest}')
        sf_lines.append('')
    sf_content = '\r\n'.join(sf_lines).encode('utf-8')
    
    # 3. Create CERT.RSA using openssl smime (PKCS#7 with SHA1)
    with tempfile.NamedTemporaryFile('wb', delete=False) as f_sf:
        f_sf.write(sf_content)
        f_sf_path = f_sf.name
    
    f_rsa_path = f_sf_path + '.rsa'
    cmd = [
        'openssl', 'smime', '-sign', '-in', f_sf_path, '-out', f_rsa_path,
        '-outform', 'DER', '-signer', cert_path, '-inkey', key_path,
        '-md', 'sha1', '-nodetach', '-nosmimecap', '-binary', '-noattr'
    ]
    subprocess.run(cmd, check=True)
    with open(f_rsa_path, 'rb') as f:
        rsa_content = f.read()
    os.unlink(f_sf_path)
    os.unlink(f_rsa_path)
    
    with zipfile.ZipFile(out_apk, 'w', zipfile.ZIP_DEFLATED) as zout:
        for fname in sorted(files.keys()):
            zout.writestr(fname, files[fname])
        zout.writestr('META-INF/MANIFEST.MF', manifest_content)
        zout.writestr('META-INF/CERT.SF', sf_content)
        zout.writestr('META-INF/CERT.RSA', rsa_content)
    print(f"Successfully signed {out_apk}")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key = os.path.join(script_dir, 'key.pem')
    cert = os.path.join(script_dir, 'cert.pem')
    in_apk = sys.argv[1] if len(sys.argv) > 1 else 'public/FORTUNES_EDUTECH.apk'
    out_apk = sys.argv[2] if len(sys.argv) > 2 else in_apk
    
    if in_apk == out_apk:
        tmp_out = in_apk + '.signed'
        sign_apk(in_apk, tmp_out, key, cert)
        os.replace(tmp_out, in_apk)
    else:
        sign_apk(in_apk, out_apk, key, cert)
