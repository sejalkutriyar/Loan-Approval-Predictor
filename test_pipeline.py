import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from app.models.ann_model import load_production_model
from app.models.preprocessing import preprocess_applicant

# Ek dummy applicant ka data (poori Home Credit dataset ke columns ke hisaab se
# — yahan sirf test ke liye kuch sample values de rahe hain)
sample_applicant = {
    "NAME_CONTRACT_TYPE": "Cash loans",
    "CODE_GENDER": "M",
    "FLAG_OWN_CAR": "N",
    "FLAG_OWN_REALTY": "Y",
    "CNT_CHILDREN": 0,
    "AMT_INCOME_TOTAL": 202500.0,
    "AMT_CREDIT": 406597.5,
    "AMT_ANNUITY": 24700.5,
    "AMT_GOODS_PRICE": 351000.0,
    "NAME_TYPE_SUITE": "Unaccompanied",
    "NAME_INCOME_TYPE": "Working",
    "NAME_EDUCATION_TYPE": "Secondary / secondary special",
    "NAME_FAMILY_STATUS": "Single / not married",
    "NAME_HOUSING_TYPE": "House / apartment",
    "REGION_POPULATION_RELATIVE": 0.018801,
    "DAYS_BIRTH": -9461,
    "DAYS_EMPLOYED": -637,
    "DAYS_REGISTRATION": -3648.0,
    "DAYS_ID_PUBLISH": -2120,
    "OWN_CAR_AGE": 0,
    "FLAG_MOBIL": 1,
    "FLAG_EMP_PHONE": 1,
    "FLAG_WORK_PHONE": 0,
    "FLAG_CONT_MOBILE": 1,
    "FLAG_PHONE": 1,
    "FLAG_EMAIL": 0,
    "OCCUPATION_TYPE": "Laborers",
    "CNT_FAM_MEMBERS": 1.0,
    "REGION_RATING_CLIENT": 2,
    "REGION_RATING_CLIENT_W_CITY": 2,
    "WEEKDAY_APPR_PROCESS_START": "WEDNESDAY",
    "HOUR_APPR_PROCESS_START": 10,
    "REG_REGION_NOT_LIVE_REGION": 0,
    "REG_REGION_NOT_WORK_REGION": 0,
    "LIVE_REGION_NOT_WORK_REGION": 0,
    "REG_CITY_NOT_LIVE_CITY": 0,
    "REG_CITY_NOT_WORK_CITY": 0,
    "LIVE_CITY_NOT_WORK_CITY": 0,
    "ORGANIZATION_TYPE": "Business Entity Type 3",
    "EXT_SOURCE_2": 0.262949,
    "EXT_SOURCE_3": 0.139376,
    "OBS_30_CNT_SOCIAL_CIRCLE": 2.0,
    "DEF_30_CNT_SOCIAL_CIRCLE": 2.0,
    "OBS_60_CNT_SOCIAL_CIRCLE": 2.0,
    "DEF_60_CNT_SOCIAL_CIRCLE": 2.0,
    "DAYS_LAST_PHONE_CHANGE": -1134.0,
    "FLAG_DOCUMENT_2": 0, "FLAG_DOCUMENT_3": 1, "FLAG_DOCUMENT_4": 0,
    "FLAG_DOCUMENT_5": 0, "FLAG_DOCUMENT_6": 0, "FLAG_DOCUMENT_7": 0,
    "FLAG_DOCUMENT_8": 0, "FLAG_DOCUMENT_9": 0, "FLAG_DOCUMENT_10": 0,
    "FLAG_DOCUMENT_11": 0, "FLAG_DOCUMENT_12": 0, "FLAG_DOCUMENT_13": 0,
    "FLAG_DOCUMENT_14": 0, "FLAG_DOCUMENT_15": 0, "FLAG_DOCUMENT_16": 0,
    "FLAG_DOCUMENT_17": 0, "FLAG_DOCUMENT_18": 0, "FLAG_DOCUMENT_19": 0,
    "FLAG_DOCUMENT_20": 0, "FLAG_DOCUMENT_21": 0,
    "AMT_REQ_CREDIT_BUREAU_HOUR": 0.0, "AMT_REQ_CREDIT_BUREAU_DAY": 0.0,
    "AMT_REQ_CREDIT_BUREAU_WEEK": 0.0, "AMT_REQ_CREDIT_BUREAU_MON": 0.0,
    "AMT_REQ_CREDIT_BUREAU_QRT": 0.0, "AMT_REQ_CREDIT_BUREAU_YEAR": 1.0,
}

print("Loading preprocessing pipeline...")
processed = preprocess_applicant(sample_applicant)
print(f"Processed shape: {processed.shape}")

print("\nLoading production model...")
model = load_production_model(input_size=processed.shape[1])

import torch
x = torch.FloatTensor(processed)
with torch.no_grad():
    output = model(x)
    prob = torch.sigmoid(output).item()

print(f"\nRaw probability of default: {prob:.4f}")
print(f"Decision: {'Reject/Review' if prob > 0.4 else 'Approve'}")