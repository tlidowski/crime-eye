import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv
import datetime


def format_table_view():
    pd.set_option('display.max_columns', None)


def connectAWS():
    engine = psycopg2.connect(
        database=os.getenv("DATABASE_NAME"),
        user=os.getenv("DATABASE_USERNAME"),
        password=input("Enter password: "),
        host=os.getenv("DATABASE_HOST"),
        port=os.getenv("DATABASE_PORT"),
    )
    return engine


def executeGetQuery(query, engine):
    return pd.read_sql(query, con=engine)


def getCityData(cityName, engine):
    query = 'select * from all_crime where city_name=' + "'" + cityName + "'"
    return pd.read_sql(query, con=engine)


def get_total_city_crimes(cityName, engine):
    query = 'select count(*) from all_crime where city_name=' + "'" + cityName + "'"
    return pd.read_sql(query, con=engine)


def get_crime_descriptions_and_counts(cityName, engine, start, end):
    start = f"'{start}0101'"
    end = f"'{end}1231'"
    query = "select fbi_crime_code, count(fbi_crime_code) AS Crime_Count from all_crime where city_name = '" + cityName + "'" + f' AND date >= {start} and date<= {end}' + " group by fbi_crime_code"
    return pd.read_sql(query, con=engine)


def getCityDataGivenYears(cityName, start, end, engine):
    start = f"'{start}0101'"
    end = f"'{end}1231'"
    query = 'select * from all_crime where city_name=' + "'" + cityName + "'" + f' AND date >= {start} and date<= {end}'
    return pd.read_sql(query, con=engine)


def get_crime_descriptions(cityName, engine):
    descr_query = "select distinct crime_description from all_crime where city_name = '" + cityName + "'"
    description = executeGetQuery(descr_query, engine)['crime_description'].tolist()
    return description


def get_city_population(cityName, engine):
    query = "select population from city_information where city_name='" + cityName + "'"
    return pd.read_sql(query, con=engine)


def get_city_area(cityName, engine):
    query = "select area from city_information where city_name = '" + cityName + "'"
    return pd.read_sql(query, con=engine)


def getAllCityMetaData(engine):
    query = 'select * from city_information'
    return pd.read_sql(query, con=engine)


def getCityMetaData(cityName, engine):
    query = 'select * from city_information where city_name=' + "'" + cityName + "'"
    return pd.read_sql(query, con=engine)


def initConnection():
    format_table_view()
    load_dotenv()
    currentEngine = connectAWS()
    return currentEngine
