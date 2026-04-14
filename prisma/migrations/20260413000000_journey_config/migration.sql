-- ─────────────────────────────────────────────────────────────
-- Journey configuration: manager-editable stages + steps.
-- Moves `stage` columns from PipelineStage enum → VARCHAR(64)
-- and seeds the default funnel so existing rows keep their shape.
-- ─────────────────────────────────────────────────────────────

-- CreateTable: journey_stages
CREATE TABLE `journey_stages` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `label` VARCHAR(80) NOT NULL,
    `order` INTEGER NOT NULL,
    `kind` VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    `stagnationDays` INTEGER NOT NULL DEFAULT 5,
    `slaHours` INTEGER NOT NULL DEFAULT 24,
    `color` VARCHAR(16) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `journey_stages_key_key`(`key`),
    INDEX `journey_stages_order_idx`(`order`),
    INDEX `journey_stages_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: journey_steps
CREATE TABLE `journey_steps` (
    `id` VARCHAR(191) NOT NULL,
    `stageId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` VARCHAR(500) NULL,
    `order` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `journey_steps_stageId_order_idx`(`stageId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `journey_steps` ADD CONSTRAINT `journey_steps_stageId_fkey`
    FOREIGN KEY (`stageId`) REFERENCES `journey_stages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────── Seed default stages ───────────────────────────

INSERT INTO `journey_stages` (`id`, `key`, `label`, `order`, `kind`, `stagnationDays`, `slaHours`, `active`, `createdAt`, `updatedAt`) VALUES
    ('seed_stage_prospect',     'PROSPECT',     'Prospect',     1, 'ACTIVE', 3,  24, true, NOW(3), NOW(3)),
    ('seed_stage_contacted',    'CONTACTED',    'Contacted',    2, 'ACTIVE', 5,  24, true, NOW(3), NOW(3)),
    ('seed_stage_engaged',      'ENGAGED',      'Engaged',      3, 'ACTIVE', 7,  48, true, NOW(3), NOW(3)),
    ('seed_stage_appointment',  'APPOINTMENT',  'Appointment',  4, 'ACTIVE', 3,  24, true, NOW(3), NOW(3)),
    ('seed_stage_negotiation',  'NEGOTIATION',  'Negotiation',  5, 'ACTIVE', 5,  24, true, NOW(3), NOW(3)),
    ('seed_stage_won',          'WON',          'Won',          6, 'WON',    9999, 9999, true, NOW(3), NOW(3)),
    ('seed_stage_lost',         'LOST',         'Lost',         7, 'LOST',   9999, 9999, true, NOW(3), NOW(3));

-- ─────────────────────────── Seed default steps ───────────────────────────

INSERT INTO `journey_steps` (`id`, `stageId`, `title`, `description`, `order`, `active`, `createdAt`, `updatedAt`) VALUES
    ('seed_step_prospect_1',    'seed_stage_prospect',    'Reach out within 24h',      'Open the relationship fast', 1, true, NOW(3), NOW(3)),
    ('seed_step_prospect_2',    'seed_stage_prospect',    'Capture wishlist',          'Tastes, gifts, grail pieces', 2, true, NOW(3), NOW(3)),

    ('seed_step_contacted_1',   'seed_stage_contacted',   'Book a discovery call',     'Confirm intent, not just interest', 1, true, NOW(3), NOW(3)),
    ('seed_step_contacted_2',   'seed_stage_contacted',   'Share curated pieces',      'Three max — edit hard', 2, true, NOW(3), NOW(3)),

    ('seed_step_engaged_1',     'seed_stage_engaged',     'Schedule in-boutique visit', 'Private room if VIP', 1, true, NOW(3), NOW(3)),
    ('seed_step_engaged_2',     'seed_stage_engaged',     'Send catalog',              'Reference for follow-up', 2, true, NOW(3), NOW(3)),

    ('seed_step_appointment_1', 'seed_stage_appointment', 'Confirm reservation',        NULL, 1, true, NOW(3), NOW(3)),
    ('seed_step_appointment_2', 'seed_stage_appointment', 'Prepare stock selection',    'Pull pieces day-before', 2, true, NOW(3), NOW(3)),

    ('seed_step_negotiation_1', 'seed_stage_negotiation', 'Finalize price',             NULL, 1, true, NOW(3), NOW(3)),
    ('seed_step_negotiation_2', 'seed_stage_negotiation', 'Confirm delivery date',      NULL, 2, true, NOW(3), NOW(3)),

    ('seed_step_won_1',         'seed_stage_won',         'Schedule aftercare touchpoint', 'First check-in at 30 days', 1, true, NOW(3), NOW(3));

-- ─────────────────────────── Convert enum columns to VARCHAR(64) ───────────────────────────

ALTER TABLE `clients` MODIFY `stage` VARCHAR(64) NOT NULL DEFAULT 'PROSPECT';

ALTER TABLE `pipeline_states` MODIFY `stage` VARCHAR(64) NOT NULL,
    MODIFY `fromStage` VARCHAR(64) NULL;
