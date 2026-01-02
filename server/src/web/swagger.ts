import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Galaxy Info API',
      version: '2.0.0',
      description: 'API for accessing Galaxy Info data including ships, turrets, kills, and game constants.',
      contact: {
        name: 'Wingy',
        email: 'git@wingysam.xyz'
      },
      license: {
        name: 'AGPL-3.0',
        url: 'https://www.gnu.org/licenses/agpl-3.0.en.html'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Base'
      }
    ],
    components: {
      securitySchemes: {
        ApiToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-token',
          description: 'API token for authentication. Contact Wingy#3538 for a token.'
        },
        ApiTokenQuery: {
          type: 'apiKey',
          in: 'query',
          name: 'token',
          description: 'API token as query parameter'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Ship: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Ship name'
            },
            health: {
              type: 'object',
              properties: {
                shield: {
                  type: 'number'
                },
                hull: {
                  type: 'number'
                }
              }
            },
            speed: {
              type: 'object',
              properties: {
                top: {
                  type: 'number'
                },
                acceleration: {
                  type: 'number'
                },
                turn: {
                  type: 'number'
                }
              }
            },
            weapons: {
              type: 'object',
              description: 'Ship weapons configuration'
            },
            class: {
              type: 'string',
              description: 'Ship class'
            },
            secret: {
              type: 'boolean',
              description: 'Whether the ship is secret'
            },
            test: {
              type: 'boolean',
              description: 'Whether the ship is a test ship'
            }
          }
        },
        Turret: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Turret name'
            },
            size: {
              type: 'string',
              enum: ['Tiny', 'Small', 'Medium', 'Large', 'Huge'],
              description: 'Turret size'
            },
            turretClass: {
              type: 'string',
              description: 'Turret class (e.g., Laser, Cannon, Mining)'
            },
            range: {
              type: 'number',
              description: 'Turret range'
            },
            reload: {
              type: 'number',
              description: 'Turret reload time'
            }
          }
        },
        Kill: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Kill ID'
            },
            killer_ship: {
              type: 'string',
              description: 'Killer ship name'
            },
            victim_ship: {
              type: 'string',
              description: 'Victim ship name'
            },
            victim_cost: {
              type: 'number',
              description: 'Cost of victim ship'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Date of kill'
            }
          }
        },
        GuildConfig: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Guild ID'
            },
            last_updated: {
              type: 'string',
              format: 'date-time'
            },
            members: {
              type: 'string',
              description: 'Members configuration'
            }
          }
        }
      }
    },
    security: [
      {
        ApiToken: []
      },
      {
        ApiTokenQuery: []
      }
    ]
  },
  apis: ['./src/web/api/**/*.ts']
}

export const swaggerSpec = swaggerJsdoc(options)
