/*
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

CREATE TABLE "member"(
 "id" Serial NOT NULL,
 "name" Varchar(20) NOT NULL
)
;

-- Add keys for table organization

ALTER TABLE "organization" ADD CONSTRAINT "organization_id_key" PRIMARY KEY ("id")
;

-- Add keys for table member

ALTER TABLE "member" ADD CONSTRAINT "member_id_key" PRIMARY KEY ("id")
;
