-- カウントダウン用: 生年月日（目標の「○歳の自分」までの日付計算に使用）
-- target_years は「目標年齢（歳）」の意味に統一（従来の「何年後」から変更）

alter table public.profiles add column if not exists birth_date date;

comment on column public.profiles.birth_date is 'User birth date for milestone countdown';
comment on column public.profiles.target_years is 'Target age (years old) for future self, not years from now';
