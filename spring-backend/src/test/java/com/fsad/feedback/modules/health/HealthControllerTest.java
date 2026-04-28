package com.fsad.feedback.modules.health;

import org.junit.jupiter.api.Test;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HealthControllerTest {

    @Test
    void healthEndpointReturnsOk() {
        HealthController controller = new HealthController();

        var response = controller.health();

        assertTrue(response.success());
        assertEquals(Map.of("status", "ok"), response.data());
    }
}
