import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumerank.dto.AiScoreRequest;
import java.util.List;

public class TestJackson {
    public static void main(String[] args) throws Exception {
        AiScoreRequest req = new AiScoreRequest(
            "job desc",
            List.of(new AiScoreRequest.SkillWeight("Java", 1.0f)),
            "resume",
            List.of("Java")
        );
        ObjectMapper mapper = new ObjectMapper();
        System.out.println(mapper.writeValueAsString(req));
    }
}
