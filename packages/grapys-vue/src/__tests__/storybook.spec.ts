import { describe, it, expect } from "vitest";
import { render } from "@testing-library/vue";

import * as SigninButtonStories from "../components/SigninButton.stories";

// ここでは Storybook の composeStories には依存せず、
// デフォルトストーリーをそのままレンダリングする簡単なスモークテストにする。
const { Default: SigninButton } = SigninButtonStories as { Default: any };

describe("SigninButton story", () => {
  it("renders a button element", async () => {
    const { getByRole } = render(SigninButton);
    const btn = getByRole("button");
    expect(btn).toBeTruthy();
  });
});

