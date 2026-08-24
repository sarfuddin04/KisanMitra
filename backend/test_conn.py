import psycopg2

passwords = ["KisanMitra2026", "postgres", "admin", "password", "123456", ""]
dbnames = ["postgres", "kisanmitra"]

for dbname in dbnames:
    for pwd in passwords:
        try:
            conn = psycopg2.connect(
                host="127.0.0.1", port=5432,
                user="postgres", password=pwd, dbname=dbname
            )
            print(f"SUCCESS: user=postgres  password='{pwd}'  db={dbname}")
            conn.close()
        except Exception as e:
            pass

# Also try kisanmitra_user
for dbname in dbnames:
    for pwd in passwords:
        try:
            conn = psycopg2.connect(
                host="127.0.0.1", port=5432,
                user="kisanmitra_user", password=pwd, dbname=dbname
            )
            print(f"SUCCESS: user=kisanmitra_user  password='{pwd}'  db={dbname}")
            conn.close()
        except Exception as e:
            pass

print("Done probing.")
