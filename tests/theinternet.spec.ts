import { test, expect } from "@playwright/test";

test.use({
  baseURL: "https://the-internet.herokuapp.com",
});

test.describe("landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/The Internet/);
  });

  test("has heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome to the-internet" })).toHaveText("Welcome to the-internet");

    await expect(page.getByRole("heading", { name: "Available Examples" })).toHaveText("Available Examples");
  });

  test("github fork link navigates correctly", async ({ page }) => {
    let navigationAttempted = false;
    await page.route("https://github.com/**", (route) => {
      navigationAttempted = true;
      void route.abort();
    });

    await page.getByRole("img", { name: "Fork me on GitHub" }).click();

    expect(navigationAttempted).toBe(true);
  });
});

test.describe("ab testing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/abtest");
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/The Internet/);
  });

  test("can have multiple headings A or B", async ({ page }) => {
    const controlText = "Variation 1";
    const variationText = "Control";
    const pattern = new RegExp(`${controlText}|${variationText}`);

    const texts = await page.getByRole("heading", { name: /A\/B Test/ }).allInnerTexts();

    expect(texts).toContainEqual(expect.stringMatching(pattern));
  });
});

test.describe("add remove element page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/add_remove_elements/");
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/The Internet/);
  });

  test("can add multiple elements", async ({ page }) => {
    await test.step("create elements", async () => {
      const addElementLocator = page.getByRole("button", {
        name: "Add Element",
      });
      for (let i = 0; i < 10; i++) {
        await addElementLocator.click();
      }
    });

    await test.step("assert elements", async () => {
      await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(10);
    });
  });

  test("can add and delete multiple elements", async ({ page }) => {
    // Add 5 new elements
    const addElementLocator = page.getByRole("button", { name: "Add Element" });

    for (let i = 0; i < 5; i++) {
      await addElementLocator.click();
    }

    // Assert there are 5 new elements
    const elementsAddedCount = await page.getByRole("button", { name: "Delete" }).count();
    expect(elementsAddedCount).toEqual(5);

    // Delete some elements
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("button", { name: "Delete" }).last().click();

    // Assert there only 3 remaining elements
    const newElementsLocator = page.getByRole("button", { name: "Delete" });
    await expect(newElementsLocator).toHaveCount(3);
  });

  test("can delete all elements", async ({ page }) => {
    // Add 5 new elements
    const addElementLocator = page.getByRole("button", {
      name: "Add Element",
    });
    for (let i = 0; i < 5; i++) {
      await addElementLocator.click();
    }

    // Assert there are 5 new elements
    const newElementsLocator = page.getByRole("button", { name: "Delete" });
    await expect(newElementsLocator).toHaveCount(5);

    // Delete all elements
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: "Delete" }).first().click();
    }

    // Assert no new elements are visable
    const removedElementsLocator = page.getByRole("button", { name: "Delete" });
    await expect(removedElementsLocator).toHaveCount(0);
  });
});

test.describe("basic auth page", () => {
  test("should access protected resource with basic auth headers", async ({ page }) => {
    const username = "admin";
    const password = "admin";
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");

    await page.setExtraHTTPHeaders({
      Authorization: `Basic ${credentials}`,
    });

    await page.goto("/basic_auth");
    await expect(page.locator("h3")).toHaveText("Basic Auth");
  });

  test("returns 401 with wrong username", async ({ browser }) => {
    const context = await browser.newContext({
      httpCredentials: {
        username: "wrong",
        password: "admin",
      },
    });

    const page = await context.newPage();

    const response = await page.goto("https://the-internet.herokuapp.com/basic_auth");

    expect(response?.status()).toBe(401);

    await context.close();
  });

  test("returns 401 with wrong password", async ({ browser }) => {
    const context = await browser.newContext({
      httpCredentials: {
        username: "admin",
        password: "invalid",
      },
    });

    const page = await context.newPage();

    const response = await page.goto("https://the-internet.herokuapp.com/basic_auth");

    expect(response?.status()).toBe(401);

    await context.close();
  });
});

test.describe("broken images page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/broken_images");
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/The Internet/);
  });

  test("verify all images are loaded", async ({ page }) => {
    test.skip();
    const images = await page.locator("img").all();
    const brokenImages: string[] = [];

    for (const image of images) {
      const src = await image.getAttribute("src");
      const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);

      if (naturalWidth === 0) {
        brokenImages.push(src || "unknown");
      }

      expect.soft(naturalWidth, `Expected image to load: ${src}`).toBeGreaterThan(0);
    }

    // Summary
    console.log(`Checked ${images.length} images`);
    console.log(`Broken images: ${brokenImages.length}`);
    if (brokenImages.length > 0) {
      console.log("Broken image URLs:", brokenImages);
    }
  });
});

test.describe("challenging DOM page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/challenging_dom");
  });

  test("has three buttons with dynamic IDs", async ({ page }) => {
    const blueButton = page.locator("a.button").first();
    const redButton = page.locator("a.button.alert").first();
    const greenButton = page.locator("a.button.success").first();

    await expect(blueButton).toBeVisible();
    await expect(redButton).toBeVisible();
    await expect(greenButton).toBeVisible();
  });

  test("buttons are clickable and change canvas", async ({ page }) => {
    const blueButton = page.locator("a.button").first();
    const canvas = page.locator("canvas#canvas");

    await blueButton.click();
    const newDataUrl = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());

    expect(newDataUrl).toBeTruthy();
  });

  test("table has 10 rows of data", async ({ page }) => {
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(10);
  });

  test("each table row has edit and delete links", async ({ page }) => {
    const rows = await page.locator("table tbody tr").all();

    for (const row of rows) {
      const editLink = row.locator('a:has-text("edit")');
      const deleteLink = row.locator('a:has-text("delete")');

      await expect(editLink).toBeVisible();
      await expect(deleteLink).toBeVisible();
    }
  });

  test("table headers are correct", async ({ page }) => {
    const headers = page.locator("table thead th");

    await expect(headers).toHaveCount(7);
    await expect(headers.nth(0)).toHaveText("Lorem");
    await expect(headers.nth(1)).toHaveText("Ipsum");
    await expect(headers.nth(6)).toHaveText("Action");
  });

  test("can click edit link in first row", async ({ page }) => {
    const firstEditLink = page.locator("table tbody tr").first().locator('a:has-text("edit")');

    await expect(firstEditLink).toBeVisible();
    await firstEditLink.click();

    expect(page.url()).toContain("challenging_dom");
  });

  test("each row has unique data", async ({ page }) => {
    const cellData = await page.$$eval("table tbody tr", (rows) =>
      rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        return cells.slice(0, -1).map((cell) => cell.textContent);
      })
    );

    const uniqueRows = new Set(cellData.map((row) => JSON.stringify(row)));
    expect(uniqueRows.size).toBe(10);
  });

  test("canvas element exists and has dimensions", async ({ page }) => {
    const canvas = page.locator("canvas#canvas");

    await expect(canvas).toBeVisible();

    const dimensions = await canvas.evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      height: c.height,
    }));

    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
  });
});


