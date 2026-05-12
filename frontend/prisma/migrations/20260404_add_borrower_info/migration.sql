-- AlterTable
ALTER TABLE "borrow_requests" ADD COLUMN "borrower_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "borrow_requests" ADD COLUMN "id_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "borrow_requests" ADD COLUMN "department_course" TEXT NOT NULL DEFAULT '';
ALTER TABLE "borrow_requests" ADD COLUMN "contact_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "borrow_requests" ADD COLUMN "expected_return_date" DATETIME;
ALTER TABLE "borrow_requests" ADD COLUMN "purpose" TEXT;
