package ua.pnu.smartcode.model;

import lombok.Getter;

@Getter
public enum ProgrammingLanguage {
    JAVA("Java", ".java"),
    PYTHON("Python", ".py"),
    JAVASCRIPT("JavaScript", ".js"),
    TYPESCRIPT("TypeScript", ".ts");

    private final String displayName;
    private final String fileExtension;

    ProgrammingLanguage(String displayName, String fileExtension) {
        this.displayName = displayName;
        this.fileExtension = fileExtension;
    }

    public static ProgrammingLanguage fromFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        for (ProgrammingLanguage lang : values()) {
            if (filename.toLowerCase().endsWith(lang.fileExtension)) {
                return lang;
            }
        }
        return null;
    }
}
