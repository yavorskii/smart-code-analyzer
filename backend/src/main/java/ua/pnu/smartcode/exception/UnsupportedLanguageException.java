package ua.pnu.smartcode.exception;

import ua.pnu.smartcode.model.ProgrammingLanguage;

public class UnsupportedLanguageException extends RuntimeException {

    public UnsupportedLanguageException(ProgrammingLanguage language) {
        super("Analyzer for language " + (language != null ? language.getDisplayName() : "null") + " is not implemented yet");
    }

    public UnsupportedLanguageException(String message) {
        super(message);
    }
}
