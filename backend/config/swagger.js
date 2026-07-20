const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NTPC VIMS+ API',
            version: '1.0.0',
            description: 'SAP-Integrated Vendor Invoice Management & HR Workflow Simulation Platform API',
            contact: { name: 'NTPC Development Team' },
        },
        servers: [
            { url: 'http://localhost:5000', description: 'Development server' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
