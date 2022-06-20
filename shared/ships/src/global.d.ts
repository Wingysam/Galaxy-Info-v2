import { Ships, Turrets } from ".";

declare global {
  type GalaxyInfo = {
    turrets: Turrets,
    ships: Ships,
    prisma: any
  }
}