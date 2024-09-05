CREATE DATABASE urlshortener;

CREATE TABLE url_table (
    id VARCHAR(255) PRIMARY KEY,
    url TEXT UNIQUE
);