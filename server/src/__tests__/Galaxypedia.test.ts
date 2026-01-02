import { Galaxypedia } from "../Galaxypedia";

describe("Galaxypedia", () => {
  it("should get image for Theia ship", async () => {
    const galaxypedia = new Galaxypedia();

    const result = await galaxypedia.getShipImage("Theia");

    expect(typeof result).toBe("string");
  });
});
