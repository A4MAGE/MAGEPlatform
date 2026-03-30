DROP TABLE IF EXISTS preset;

create table preset (
  author bigint primary key generated always as identity,
  name text not null,
  tag int not null,
  audioSource text not null
);

insert into preset (name, tag, audioSource)
values
  ('Brandon', 1, 'mic'),
  ('Song1',   2, 'line-in'),
  ('3123',    3, 'usb'),
  ('dasdada', 4, 'bluetooth');
