import requests
import pandas as pd

url = "http://127.0.0.1:5000/predict"
data = {
    "age": 51,
    "gender": "female",
    "water_src": "spring",
    "sanitation": "good",
    "vacc_typhoid": 0,
    "vacc_hepA": 1,
    "diarrhea_count": 3,
    "vomit_count": 2,
    "body_temp": 40.16,
    "dehydration": 1,
    "jaundice": 0,
    "dark_urine": 0,
    "pale_stool": 0,
    "headache": 0,
    "fatigue": 1,
    "muscle_ache": 1,
    "stool_type": "watery"
}

df = pd.DataFrame([data])  # single row


res = requests.post(url, json=data)
print(res.json())
