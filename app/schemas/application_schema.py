from typing import Literal
from pydantic import BaseModel, Field

# Categorical Literals matching Home Credit dataset domain
ContractType = Literal["Cash loans", "Revolving loans"]
GenderType = Literal["M", "F", "XNA"]
BinaryFlag = Literal["Y", "N"]

SuiteType = Literal[
    "Unaccompanied",
    "Family",
    "Spouse, partner",
    "Children",
    "Other_A",
    "Other_B",
    "Group of people",
]

IncomeType = Literal[
    "Working",
    "Commercial associate",
    "Pensioner",
    "State servant",
    "Unemployed",
    "Student",
    "Businessman",
    "Maternity leave",
]

EducationType = Literal[
    "Higher education",
    "Secondary / secondary special",
    "Incomplete higher",
    "Lower secondary",
    "Academic degree",
]

FamilyStatusType = Literal[
    "Married",
    "Single / not married",
    "Civil marriage",
    "Separated",
    "Widow",
    "Unknown",
]

HousingType = Literal[
    "House / apartment",
    "With parents",
    "Municipal apartment",
    "Rented apartment",
    "Office apartment",
    "Co-op apartment",
]

WeekdayType = Literal[
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
]


class ApplicantData(BaseModel):
    # Core Loan Request
    NAME_CONTRACT_TYPE: ContractType
    CODE_GENDER: GenderType
    FLAG_OWN_CAR: BinaryFlag
    FLAG_OWN_REALTY: BinaryFlag
    CNT_CHILDREN: int = Field(ge=0, description="Number of children")
    AMT_INCOME_TOTAL: float = Field(gt=0, description="Total annual income")
    AMT_CREDIT: float = Field(gt=0, description="Loan credit amount")
    AMT_ANNUITY: float = Field(gt=0, description="Annual EMI annuity")
    AMT_GOODS_PRICE: float = Field(gt=0, description="Asset goods price valuation")
    NAME_TYPE_SUITE: SuiteType
    NAME_INCOME_TYPE: IncomeType
    NAME_EDUCATION_TYPE: EducationType
    NAME_FAMILY_STATUS: FamilyStatusType
    NAME_HOUSING_TYPE: HousingType
    REGION_POPULATION_RELATIVE: float
    DAYS_BIRTH: int = Field(description="Age in negative days")
    DAYS_EMPLOYED: int = Field(description="Employment duration in negative days")
    DAYS_REGISTRATION: float
    DAYS_ID_PUBLISH: int
    OWN_CAR_AGE: float = Field(ge=0)
    FLAG_MOBIL: int
    FLAG_EMP_PHONE: int
    FLAG_WORK_PHONE: int
    FLAG_CONT_MOBILE: int
    FLAG_PHONE: int
    FLAG_EMAIL: int
    OCCUPATION_TYPE: str
    CNT_FAM_MEMBERS: float = Field(ge=1.0)
    REGION_RATING_CLIENT: int
    REGION_RATING_CLIENT_W_CITY: int
    WEEKDAY_APPR_PROCESS_START: WeekdayType
    HOUR_APPR_PROCESS_START: int = Field(ge=0, le=23)
    REG_REGION_NOT_LIVE_REGION: int
    REG_REGION_NOT_WORK_REGION: int
    LIVE_REGION_NOT_WORK_REGION: int
    REG_CITY_NOT_LIVE_CITY: int
    REG_CITY_NOT_WORK_CITY: int
    LIVE_CITY_NOT_WORK_CITY: int
    ORGANIZATION_TYPE: str
    EXT_SOURCE_2: float = Field(ge=0.0, le=1.0, description="CIBIL / Equifax Bureau score")
    EXT_SOURCE_3: float = Field(ge=0.0, le=1.0, description="Experian / CRIF Bureau score")
    OBS_30_CNT_SOCIAL_CIRCLE: float
    DEF_30_CNT_SOCIAL_CIRCLE: float
    OBS_60_CNT_SOCIAL_CIRCLE: float
    DEF_60_CNT_SOCIAL_CIRCLE: float
    DAYS_LAST_PHONE_CHANGE: float
    FLAG_DOCUMENT_2: int
    FLAG_DOCUMENT_3: int
    FLAG_DOCUMENT_4: int
    FLAG_DOCUMENT_5: int
    FLAG_DOCUMENT_6: int
    FLAG_DOCUMENT_7: int
    FLAG_DOCUMENT_8: int
    FLAG_DOCUMENT_9: int
    FLAG_DOCUMENT_10: int
    FLAG_DOCUMENT_11: int
    FLAG_DOCUMENT_12: int
    FLAG_DOCUMENT_13: int
    FLAG_DOCUMENT_14: int
    FLAG_DOCUMENT_15: int
    FLAG_DOCUMENT_16: int
    FLAG_DOCUMENT_17: int
    FLAG_DOCUMENT_18: int
    FLAG_DOCUMENT_19: int
    FLAG_DOCUMENT_20: int
    FLAG_DOCUMENT_21: int
    AMT_REQ_CREDIT_BUREAU_HOUR: float
    AMT_REQ_CREDIT_BUREAU_DAY: float
    AMT_REQ_CREDIT_BUREAU_WEEK: float
    AMT_REQ_CREDIT_BUREAU_MON: float
    AMT_REQ_CREDIT_BUREAU_QRT: float
    AMT_REQ_CREDIT_BUREAU_YEAR: float
