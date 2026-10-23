ALTER TABLE initial_screening
    ADD COLUMN IF NOT EXISTS performance_assessment_option_id integer
        REFERENCES assessment_options (assessment_option_id)
        ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS performance_points numeric(10, 4);
