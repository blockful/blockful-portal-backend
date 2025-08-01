const { db } = require("../db");
const { ooo } = require("../db/schema");
const { eq, desc, and } = require("drizzle-orm");

async function OOORoutes(fastify: any, options: any) {
  // Create OOO (Out of Office) request
  fastify.post("/ooo", async (request: any, reply: any) => {
    try {
      const {
        userName,
        userEmail,
        active = true,
        startDate,
        endDate,
        reason,
        message,
        emergencyContact = "",
      } = request.body;

      // Validate required fields
      if (
        !userName ||
        !userEmail ||
        !startDate ||
        !endDate ||
        !reason ||
        !message
      ) {
        reply.code(400).send({
          error: "Missing required fields",
          required: [
            "userName",
            "userEmail",
            "startDate",
            "endDate",
            "reason",
            "message",
          ],
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        reply.code(400).send({ error: "Invalid email format" });
        return;
      }

      // Validate dates
      const startDateValue = new Date(startDate);
      const endDateValue = new Date(endDate);

      if (isNaN(startDateValue.getTime())) {
        reply.code(400).send({ error: "Invalid start date" });
        return;
      }

      if (isNaN(endDateValue.getTime())) {
        reply.code(400).send({ error: "Invalid end date" });
        return;
      }

      // Validate that end date is after start date
      if (endDateValue <= startDateValue) {
        reply.code(400).send({ error: "End date must be after start date" });
        return;
      }

      // Create OOO record
      const oooRecord = await db
        .insert(ooo)
        .values({
          userName: userName,
          userEmail: userEmail,
          active: active,
          startDate: startDateValue,
          endDate: endDateValue,
          reason: reason,
          message: message,
          emergencyContact: emergencyContact || null,
        })
        .returning();

      reply.code(201).send({
        message: "OOO request created successfully",
        ooo: {
          id: oooRecord[0].id,
          userName: oooRecord[0].userName,
          userEmail: oooRecord[0].userEmail,
          active: oooRecord[0].active,
          startDate: oooRecord[0].startDate,
          endDate: oooRecord[0].endDate,
          reason: oooRecord[0].reason,
          message: oooRecord[0].message,
          emergencyContact: oooRecord[0].emergencyContact,
          createdAt: oooRecord[0].createdAt,
        },
      });
    } catch (error: any) {
      fastify.log.error("Create OOO error:", error);
      reply.code(500).send({
        error: "Failed to create OOO request",
        message: error.message,
      });
    }
  });

  // Get all OOO requests
  fastify.get("/ooo", async (request: any, reply: any) => {
    try {
      const { active, limit = 50, offset = 0 } = request.query;

      let query = db
        .select()
        .from(ooo)
        .orderBy(desc(ooo.createdAt))
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      if (active !== undefined) {
        const activeValue = active === "true" || active === true;
        query = query.where(eq(ooo.active, activeValue));
      }

      const allOOO = await query;

      reply.send({
        ooo: allOOO.map((o: any) => ({
          id: o.id,
          userName: o.userName,
          userEmail: o.userEmail,
          active: o.active,
          startDate: o.startDate,
          endDate: o.endDate,
          reason: o.reason,
          message: o.message,
          emergencyContact: o.emergencyContact,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        })),
        total: allOOO.length,
      });
    } catch (error) {
      fastify.log.error("Get OOO error:", error);
      reply.code(500).send({ error: "Failed to fetch OOO requests" });
    }
  });

  // Get specific OOO request
  fastify.get("/ooo/:id", async (request: any, reply: any) => {
    try {
      const { id } = request.params;

      const oooRecord = await db
        .select()
        .from(ooo)
        .where(eq(ooo.id, parseInt(id)))
        .limit(1);

      if (oooRecord.length === 0) {
        reply.code(404).send({ error: "OOO request not found" });
        return;
      }

      reply.send({
        ooo: {
          id: oooRecord[0].id,
          userName: oooRecord[0].userName,
          userEmail: oooRecord[0].userEmail,
          active: oooRecord[0].active,
          startDate: oooRecord[0].startDate,
          endDate: oooRecord[0].endDate,
          reason: oooRecord[0].reason,
          message: oooRecord[0].message,
          emergencyContact: oooRecord[0].emergencyContact,
          createdAt: oooRecord[0].createdAt,
          updatedAt: oooRecord[0].updatedAt,
        },
      });
    } catch (error) {
      fastify.log.error("Get OOO error:", error);
      reply.code(500).send({ error: "Failed to fetch OOO request" });
    }
  });

  // Update OOO request
  fastify.put("/ooo/:id", async (request: any, reply: any) => {
    try {
      const { id } = request.params;
      const { active, startDate, endDate, reason, message, emergencyContact } =
        request.body;

      // Validate dates if provided
      let startDateValue, endDateValue;

      if (startDate) {
        startDateValue = new Date(startDate);
        if (isNaN(startDateValue.getTime())) {
          reply.code(400).send({ error: "Invalid start date" });
          return;
        }
      }

      if (endDate) {
        endDateValue = new Date(endDate);
        if (isNaN(endDateValue.getTime())) {
          reply.code(400).send({ error: "Invalid end date" });
          return;
        }
      }

      // Validate date range if both dates are provided
      if (startDateValue && endDateValue && endDateValue <= startDateValue) {
        reply.code(400).send({ error: "End date must be after start date" });
        return;
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (active !== undefined) updateData.active = active;
      if (startDateValue) updateData.startDate = startDateValue;
      if (endDateValue) updateData.endDate = endDateValue;
      if (reason !== undefined) updateData.reason = reason;
      if (message !== undefined) updateData.message = message;
      if (emergencyContact !== undefined)
        updateData.emergencyContact = emergencyContact;

      const oooRecord = await db
        .update(ooo)
        .set(updateData)
        .where(eq(ooo.id, parseInt(id)))
        .returning();

      if (oooRecord.length === 0) {
        reply.code(404).send({ error: "OOO request not found" });
        return;
      }

      reply.send({
        message: "OOO request updated successfully",
        ooo: {
          id: oooRecord[0].id,
          userName: oooRecord[0].userName,
          userEmail: oooRecord[0].userEmail,
          active: oooRecord[0].active,
          startDate: oooRecord[0].startDate,
          endDate: oooRecord[0].endDate,
          reason: oooRecord[0].reason,
          message: oooRecord[0].message,
          emergencyContact: oooRecord[0].emergencyContact,
          updatedAt: oooRecord[0].updatedAt,
        },
      });
    } catch (error) {
      fastify.log.error("Update OOO error:", error);
      reply.code(500).send({ error: "Failed to update OOO request" });
    }
  });

  // Delete OOO request
  fastify.delete("/ooo/:id", async (request: any, reply: any) => {
    try {
      const { id } = request.params;

      const oooRecord = await db
        .delete(ooo)
        .where(eq(ooo.id, parseInt(id)))
        .returning();

      if (oooRecord.length === 0) {
        reply.code(404).send({ error: "OOO request not found" });
        return;
      }

      reply.send({
        message: "OOO request deleted successfully",
      });
    } catch (error) {
      fastify.log.error("Delete OOO error:", error);
      reply.code(500).send({ error: "Failed to delete OOO request" });
    }
  });
}

module.exports = OOORoutes;
