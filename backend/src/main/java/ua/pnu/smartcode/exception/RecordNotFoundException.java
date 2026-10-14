package ua.pnu.smartcode.exception;

import java.util.UUID;

public class RecordNotFoundException extends RuntimeException {

    public RecordNotFoundException(UUID id) {
        super("Analysis record not found for id: " + id);
    }
}
