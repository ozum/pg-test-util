﻿/*
^----- First character is an error in SQL syntax. It is there to test if it is trimmed as expected.
Created: 20/08/2015
Modified: 13/09/2015
Author: Özüm Eldoğan
Version: 1.0
Database: PostgreSQL 9.4
*/

-- Create Table -------------------------------------------------

CREATE TABLE "organization"(
 "id" Serial NOT NULL,
 "base_currency" Character(3) NOT NULL
)
;

-- Add keys for table organization

ALTER TABLE "organization" ADD CONSTRAINT "Key5" PRIMARY KEY ("id")
;

INSERT INTO organization (id, base_currency) VALUES (1, 'TRY');