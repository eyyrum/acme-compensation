-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "currency" (
    "code" CHAR(3) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "minor_units" INTEGER NOT NULL DEFAULT 2,
    "rate_to_usd" DECIMAL(18,8) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "country" (
    "code" CHAR(2) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "department" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "employee_code" VARCHAR(20) NOT NULL,
    "first_name" VARCHAR(60) NOT NULL,
    "last_name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "job_title" VARCHAR(100) NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_on" DATE NOT NULL,
    "department_id" INTEGER NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "base_salary_minor" BIGINT NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_name_key" ON "department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employee_code_key" ON "employee"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_email_key" ON "employee"("email");

-- CreateIndex
CREATE INDEX "employee_department_id_idx" ON "employee"("department_id");

-- CreateIndex
CREATE INDEX "employee_country_code_idx" ON "employee"("country_code");

-- CreateIndex
CREATE INDEX "employee_status_idx" ON "employee"("status");

-- CreateIndex
CREATE INDEX "employee_last_name_first_name_idx" ON "employee"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "employee_department_id_status_idx" ON "employee"("department_id", "status");

-- CreateIndex
CREATE INDEX "employee_country_code_status_idx" ON "employee"("country_code", "status");

-- AddForeignKey
ALTER TABLE "country" ADD CONSTRAINT "country_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
