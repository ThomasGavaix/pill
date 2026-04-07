-- dosage is now managed per prescription phase, not per medication
alter table medications alter column dosage drop not null;
