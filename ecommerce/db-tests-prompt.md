You are acting as a strict grader for the MySQL database portion of my course project.
Please audit my project against the assignment requirements and determine whether my database deliverable is compliant.

I am using MySQL.
My project is a 2-person group project, so the schema must contain at least 9 necessary tables.

Your task is to inspect my database-related files/code and evaluate whether my project satisfies the following MySQL requirements.

Assignment requirements you must check
The submission must include a self-contained dump file that contains everything needed to recreate the database.
It should include:
DDL for all database objects
DML / sample tuples so the system can be evaluated easily
tables, indexes, constraints
user-defined functions, procedures, triggers
Since this is a 2-person group, the schema must contain at least 9 necessary tables.
All tables should be normalized to Third Normal Form (3NF) with no unnecessary redundancy.
Tables should have a primary key, and when applicable, foreign keys representing relationships in the class diagram.
Foreign keys should include integrity actions such as ON DELETE and ON UPDATE when appropriate.
The project should be modular and use server-side database programming objects such as functions, procedures, triggers, events. The front end should not contain excessive SQL logic.
The schema should include field constraints such as NOT NULL, UNIQUE, DEFAULT, etc.
There should be error handling.
The dump submission should be complete by itself and should not require an additional separate database submission.
What I want you to do

Please perform a thorough database audit and produce a report with the following sections.

1. Overall verdict

Give one of these:

PASS
PASS WITH MINOR ISSUES
PARTIAL / RISKY
FAIL

Then explain the main reason in 3–6 sentences.

2. Requirement-by-requirement checklist

For each requirement above, provide:

Status: PASS / FAIL / UNCLEAR
Evidence: exact file names, SQL objects, code snippets, or commands that support your judgment
Why it passes or fails
What to fix if it fails
3. Concrete technical checks you must run

Please verify as many of these as possible.

A. Dump completeness

Check whether a single dump file can recreate the database from scratch on a clean MySQL instance.

Expected result:

The dump imports successfully without requiring missing manual steps
Tables, indexes, constraints, routines, triggers, and data are created
No critical SQL errors block setup
B. Table count

Count the actual number of necessary project tables and compare it with the required minimum for a 2-person group.

Expected result:

The number of meaningful project tables is 9 or more
C. Primary keys / foreign keys

Inspect each table and confirm:

every table has a primary key
relationship tables or dependent tables use foreign keys where appropriate

Expected result:

No required relationship is missing a foreign key
No core table is missing a primary key
D. ON DELETE / ON UPDATE actions

Inspect foreign key definitions and verify whether referential actions are explicitly defined when applicable.

Expected result:

Foreign keys include sensible ON DELETE / ON UPDATE behavior
If any FK lacks such clauses, flag it clearly
E. 3NF / redundancy review

Review the schema design and identify whether any table appears to violate 3NF, such as:

repeating groups
duplicated facts
partial dependency
transitive dependency
unnecessary redundant columns

Expected result:

The schema is reasonably in 3NF
If you cannot formally prove full 3NF from the available files, give a practical schema review and identify suspicious tables/columns
F. Constraints

Check whether fields appropriately use:

NOT NULL
UNIQUE
DEFAULT
other useful constraints if present

Expected result:

Important required fields are not nullable
Uniqueness is enforced where appropriate
Defaults are used where sensible
G. Database programming objects

Check whether the database actually uses:

stored procedures
functions
triggers
events

Expected result:

There is meaningful server-side database logic
If some objects are missing, clearly say which ones are present and which ones are absent
H. Error handling

Check whether there is evidence of database-side or application-side error handling related to database operations, such as:

exception/handler logic in procedures
validation before invalid inserts/updates
graceful handling of constraint violations
transaction rollback or failure handling where relevant

Expected result:

The system has identifiable error handling
If error handling is weak or absent, mark it clearly
I. Modularity / excessive SQL in front end

Review whether the project appears modular and whether too much SQL is embedded directly in front-end/client code.

Expected result:

SQL/database logic is reasonably separated
database programming objects are actually used
if the front end is overloaded with raw SQL, flag it
Required evidence

Please include evidence such as:

file names
SQL object names
specific CREATE TABLE / CREATE PROCEDURE / CREATE TRIGGER statements
relevant snippets
if possible, commands you ran and their outputs

Useful MySQL checks may include:

SHOW TABLES;
SHOW CREATE TABLE table_name;
SHOW TRIGGERS;
SHOW PROCEDURE STATUS;
SHOW FUNCTION STATUS;
queries against information_schema for constraints, keys, triggers, routines, and events

Test results

For each technical test you performed, provide:

Test name
What you checked
Expected result
Actual result
Pass/Fail

Important grading behavior

Be strict and concrete. Do not give vague praise.
If something is missing, say so clearly.
If something cannot be verified from the available files, mark it UNCLEAR instead of guessing.
If my project only partially satisfies a requirement, explain exactly why.