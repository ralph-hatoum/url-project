CREATE DATABASE urlshortener;

CREATE TABLE url_table (
    id VARCHAR(255) PRIMARY KEY,
    url TEXT UNIQUE
);

CREATE TABLE performance (
    request_type VARCHAR(255) PRIMARY KEY,
    duration FLOAT
);

CREATE TABLE request_count(
    request_type VARCHAR(255) PRIMARY KEY,
    number_of_requests INTEGER
);

INSERT INTO request_count(request_type, number_of_requests) VALUES ('get_link_from_id', 0);

INSERT INTO request_count(request_type, number_of_requests) VALUES ('new_short_link', 0);