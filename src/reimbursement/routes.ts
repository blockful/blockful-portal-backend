const { db } = require("../db");
const { reimbursements } = require("../db/schema");
const { eq, desc, and } = require("drizzle-orm");
const fs = require("fs");
const path = require("path");

async function reimbursementRoutes(fastify: any, options: any) {
  // Create reimbursement request with file upload
  fastify.post(
    "/reimbursements",
    async (request: any, reply: any) => {
      try {
        const data = await request.file();
        
        if (!data) {
          reply.code(400).send({ error: "No file uploaded" });
          return;
        }

        // Validate required fields
        const { amount, currency = "USD", description, invoiceDate, userId } = data.fields;
        
        if (!amount || !invoiceDate || !userId) {
          reply.code(400).send({ 
            error: "Missing required fields", 
            required: ["amount", "invoiceDate", "userId"] 
          });
          return;
        }

        // Validate amount
        const amountValue = parseFloat(amount.value);
        if (isNaN(amountValue) || amountValue <= 0) {
          reply.code(400).send({ error: "Invalid amount" });
          return;
        }

        // Validate date
        const invoiceDateValue = new Date(invoiceDate.value);
        if (isNaN(invoiceDateValue.getTime())) {
          reply.code(400).send({ error: "Invalid invoice date" });
          return;
        }

        // Validate userId
        const userIdValue = parseInt(userId.value);
        if (isNaN(userIdValue) || userIdValue <= 0) {
          reply.code(400).send({ error: "Invalid user ID" });
          return;
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, "..", "..", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = path.extname(data.filename);
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
        const filePath = path.join(uploadsDir, uniqueFilename);

        // Save file
        await data.file.pipe(fs.createWriteStream(filePath));

        // Create reimbursement record
        const reimbursement = await db
          .insert(reimbursements)
          .values({
            userId: userIdValue,
            amount: amountValue,
            currency: currency.value || "USD",
            description: description?.value || null,
            invoiceDate: invoiceDateValue,
            filePath: uniqueFilename,
            fileName: data.filename,
            fileSize: data.file.bytesRead,
            mimeType: data.mimetype,
          })
          .returning();

        reply.code(201).send({
          message: "Reimbursement request created successfully",
          reimbursement: {
            id: reimbursement[0].id,
            amount: reimbursement[0].amount,
            currency: reimbursement[0].currency,
            description: reimbursement[0].description,
            invoiceDate: reimbursement[0].invoiceDate,
            status: reimbursement[0].status,
            fileName: reimbursement[0].fileName,
            createdAt: reimbursement[0].createdAt,
          },
        });
      } catch (error: any) {
        fastify.log.error("Create reimbursement error:", error);
        reply.code(500).send({
          error: "Failed to create reimbursement request",
          message: error.message,
        });
      }
    }
  );

  // Get user's reimbursements
  fastify.get(
    "/reimbursements",
    async (request: any, reply: any) => {
      try {
        const { userId, status, limit = 50, offset = 0 } = request.query;

        if (!userId) {
          reply.code(400).send({ error: "userId is required" });
          return;
        }

        const userIdValue = parseInt(userId);
        if (isNaN(userIdValue) || userIdValue <= 0) {
          reply.code(400).send({ error: "Invalid user ID" });
          return;
        }

        let query = db
          .select()
          .from(reimbursements)
          .where(eq(reimbursements.userId, userIdValue))
          .orderBy(desc(reimbursements.createdAt))
          .limit(parseInt(limit))
          .offset(parseInt(offset));

        if (status) {
          query = query.where(eq(reimbursements.status, status));
        }

        const userReimbursements = await query;

        reply.send({
          reimbursements: userReimbursements.map((r: any) => ({
            id: r.id,
            amount: r.amount,
            currency: r.currency,
            description: r.description,
            invoiceDate: r.invoiceDate,
            status: r.status,
            fileName: r.fileName,
            createdAt: r.createdAt,
          })),
          total: userReimbursements.length,
        });
      } catch (error) {
        fastify.log.error("Get reimbursements error:", error);
        reply.code(500).send({ error: "Failed to fetch reimbursements" });
      }
    }
  );

  // Get specific reimbursement
  fastify.get(
    "/reimbursements/:id",
    async (request: any, reply: any) => {
      try {
        const { id } = request.params;

        const reimbursement = await db
          .select()
          .from(reimbursements)
          .where(eq(reimbursements.id, parseInt(id)))
          .limit(1);

        if (reimbursement.length === 0) {
          reply.code(404).send({ error: "Reimbursement not found" });
          return;
        }

        reply.send({
          reimbursement: {
            id: reimbursement[0].id,
            amount: reimbursement[0].amount,
            currency: reimbursement[0].currency,
            description: reimbursement[0].description,
            invoiceDate: reimbursement[0].invoiceDate,
            status: reimbursement[0].status,
            fileName: reimbursement[0].fileName,
            fileSize: reimbursement[0].fileSize,
            mimeType: reimbursement[0].mimeType,
            createdAt: reimbursement[0].createdAt,
            updatedAt: reimbursement[0].updatedAt,
          },
        });
      } catch (error) {
        fastify.log.error("Get reimbursement error:", error);
        reply.code(500).send({ error: "Failed to fetch reimbursement" });
      }
    }
  );

  // Download reimbursement file
  fastify.get(
    "/reimbursements/:id/file",
    async (request: any, reply: any) => {
      try {
        const { id } = request.params;

        const reimbursement = await db
          .select()
          .from(reimbursements)
          .where(eq(reimbursements.id, parseInt(id)))
          .limit(1);

        if (reimbursement.length === 0) {
          reply.code(404).send({ error: "Reimbursement not found" });
          return;
        }

        const filePath = path.join(__dirname, "..", "..", "uploads", reimbursement[0].filePath);
        
        if (!fs.existsSync(filePath)) {
          reply.code(404).send({ error: "File not found" });
          return;
        }

        reply.header("Content-Disposition", `attachment; filename="${reimbursement[0].fileName}"`);
        reply.header("Content-Type", reimbursement[0].mimeType);
        reply.send(fs.createReadStream(filePath));
      } catch (error) {
        fastify.log.error("Download file error:", error);
        reply.code(500).send({ error: "Failed to download file" });
      }
    }
  );

  // Update reimbursement (user can only update description)
  fastify.put(
    "/reimbursements/:id",
    async (request: any, reply: any) => {
      try {
        const { id } = request.params;
        const { description } = request.body;

        const reimbursement = await db
          .update(reimbursements)
          .set({
            description: description || null,
            updatedAt: new Date(),
          })
          .where(and(
            eq(reimbursements.id, parseInt(id)),
            eq(reimbursements.status, "pending") // Only allow updates for pending reimbursements
          ))
          .returning();

        if (reimbursement.length === 0) {
          reply.code(404).send({ error: "Reimbursement not found or cannot be updated" });
          return;
        }

        reply.send({
          message: "Reimbursement updated successfully",
          reimbursement: {
            id: reimbursement[0].id,
            amount: reimbursement[0].amount,
            currency: reimbursement[0].currency,
            description: reimbursement[0].description,
            invoiceDate: reimbursement[0].invoiceDate,
            status: reimbursement[0].status,
            updatedAt: reimbursement[0].updatedAt,
          },
        });
      } catch (error) {
        fastify.log.error("Update reimbursement error:", error);
        reply.code(500).send({ error: "Failed to update reimbursement" });
      }
    }
  );

  // Delete reimbursement (only if pending)
  fastify.delete(
    "/reimbursements/:id",
    async (request: any, reply: any) => {
      try {
        const { id } = request.params;

        const reimbursement = await db
          .select()
          .from(reimbursements)
          .where(and(
            eq(reimbursements.id, parseInt(id)),
            eq(reimbursements.status, "pending")
          ))
          .limit(1);

        if (reimbursement.length === 0) {
          reply.code(404).send({ error: "Reimbursement not found or cannot be deleted" });
          return;
        }

        // Delete file if exists
        if (reimbursement[0].filePath) {
          const filePath = path.join(__dirname, "..", "..", "uploads", reimbursement[0].filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Delete from database
        await db
          .delete(reimbursements)
          .where(and(
            eq(reimbursements.id, parseInt(id)),
            eq(reimbursements.status, "pending")
          ));

        reply.send({
          message: "Reimbursement deleted successfully",
        });
      } catch (error) {
        fastify.log.error("Delete reimbursement error:", error);
        reply.code(500).send({ error: "Failed to delete reimbursement" });
      }
    }
  );
}

module.exports = reimbursementRoutes; 