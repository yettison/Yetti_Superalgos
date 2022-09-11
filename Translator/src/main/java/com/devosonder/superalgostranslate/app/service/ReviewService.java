package com.devosonder.superalgostranslate.app.service;

import com.devosonder.deepltranslator.DeepLTranslator;
import com.devosonder.deepltranslator.SourceLanguage;
import com.devosonder.deepltranslator.TargetLanguage;
import com.devosonder.superalgostranslate.app.factory.ObjectMaperFactory;
import com.devosonder.superalgostranslate.app.model.common.Paragraph;
import com.devosonder.superalgostranslate.app.model.common.Translation;
import com.devosonder.superalgostranslate.app.model.review.Review;
import com.devosonder.superalgostranslate.app.util.BlackListUtil;
import com.devosonder.superalgostranslate.app.util.FileUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import org.openqa.selenium.SessionNotCreatedException;
import org.openqa.selenium.TimeoutException;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class ReviewService {

    private final List<String> blackList = BlackListUtil.blackListStyleValues;
    private DeepLTranslator translator = null;

    public void setTranslator(DeepLTranslator translator) {
        this.translator = translator;
    }

    @SneakyThrows
    public void translate(String rootFolderName, TargetLanguage targetLanguage) {
        List<String> allFiles = FileUtil.getAllFiles(rootFolderName);
        try {
            for (String filePath : allFiles) {

                if (filePath.contains("_translated.json")) {
                    continue;
                }
                if (FileUtil.isTranslated(filePath)) {
                    System.out.println("File already translated: " + filePath);
                    continue;
                }
                System.out.println(filePath);
                ObjectMapper objectMapper = ObjectMaperFactory.getObjectMapper();

                Review review;
                try {
                    review = objectMapper.readValue(new File(filePath), Review.class);
                } catch (IOException e) {
                    System.out.println("Error File: " + filePath);
                    e.printStackTrace();
                    continue;
                }
                if (review.getReview() == null || review.getReview().isEmpty() || review.getReview().isBlank()) {
                    System.out.println("Tutorial is empty. Continuing to next file.");
                    continue;
                }
                boolean isEditedDefinition;
                boolean isEditedParagraph;


                isEditedDefinition = translateDefinition(review, targetLanguage);
                isEditedParagraph = translateParagraphs(review, targetLanguage);
                if (!isEditedDefinition && !isEditedParagraph) {
                    System.out.println("No translation found. Continuing to next file.");
                    continue;
                }
                File translatedFile = FileUtil.getTranslatedFile(filePath);
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(translatedFile, review);
                Process kill = new ProcessBuilder(
                        "powershell.exe",
                        "Get-Process chromedriver | Where StartTime -lt (Get-Date).AddMinutes(-3) | Stop-Process -Force"
                ).start();
                kill.onExit().thenRun(() -> System.out.println("\n[OK] Killed chromedriver process...\n"));

            }
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    private boolean translateParagraphs(Review review, TargetLanguage targetLanguage) {
        if (review.getParagraphs() == null) {
            return false;
        }

        boolean isEdited = false;
        for (Paragraph paragraph : review.getParagraphs()) {
            String paragraphText = null;
            String paragraphStyle = null;
            if (paragraph.getText() != null) {
                paragraphText = paragraph.getText();
            }
            if (paragraph.getStyle() != null) {
                paragraphStyle = paragraph.getStyle();
            }
            if (paragraphText == null || paragraphText.isBlank()) {
                continue;
            }
            if (paragraphStyle == null || blackList.contains(paragraphStyle)) {
                continue;
            }
            if (paragraph.getTranslations() == null) {
                paragraph.setTranslations(new ArrayList<>());
            }

            if (turkishTranslationExists(paragraph.getTranslations(), targetLanguage)) {
                continue;
            }

            Translation translation = new Translation();
            translation.setLanguage(targetLanguage.getShortLanguageCode());
            translation.setUpdated(Date.from(new Date().toInstant()).getTime());
            String translated;
            try {
                translated = translator.translate(paragraphText, SourceLanguage.ENGLISH, targetLanguage);
                isEdited = true;
            } catch (IllegalStateException | TimeoutException | SessionNotCreatedException e) {
                e.printStackTrace();
                continue;
            }
            if (!paragraphText.endsWith("\n")) {
                translated = translated.trim();
            }
            System.out.println("Original: " + paragraphText);
            System.out.println("Translated: " + translated);
            translation.setText(translated);
            translation.setStyle(paragraphStyle);
            paragraph.getTranslations().add(translation);
        }


        return isEdited;
    }

    private boolean translateDefinition(Review review, TargetLanguage targetLanguage) {
        if (review.getDefinition() == null) {
            return false;
        }
        String definitionText = null;
        if (review.getDefinition().getText() != null) {
            definitionText = review.getDefinition().getText();
        }
        if (definitionText == null) {
            return false;
        }
        if (review.getDefinition().getTranslations() == null) {
            review.getDefinition().setTranslations(new ArrayList<>());
        }

        if (turkishTranslationExists(review.getDefinition().getTranslations(), targetLanguage)) {
            return false;
        }

        Translation translation = new Translation();
        translation.setLanguage(targetLanguage.getShortLanguageCode());
        translation.setUpdated(Date.from(new Date().toInstant()).getTime());
        String translated;
        try {
            translated = translator.translate(definitionText, SourceLanguage.ENGLISH, targetLanguage);
        } catch (IllegalStateException | TimeoutException e) {
            return false;
        }
        if (!definitionText.endsWith("\n")) {
            translated = translated.trim();
        }
        System.out.println("Original: " + definitionText);
        System.out.println("Translated: " + translated);
        translation.setText(translated);
        review.getDefinition().getTranslations().add(translation);


        return true;
    }

    private boolean turkishTranslationExists(ArrayList<Translation> translations, TargetLanguage targetLanguage) {
        for (Translation translation : translations) {
            if (translation.language.equals(targetLanguage.getShortLanguageCode())) {
                return true;
            }
        }
        return false;
    }
}
