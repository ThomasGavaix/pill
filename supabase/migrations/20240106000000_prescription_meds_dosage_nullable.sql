-- dosage (concentration) is optional on prescription_meds
alter table prescription_meds alter column dosage drop not null;
