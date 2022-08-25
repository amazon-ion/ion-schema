---
title:  Using Ion Schema Schemas for syntactical validation of your schemas
---
# {{ page.title }}
_(Applies to Ion Schema 1.0 using ion-schema-kotlin v1.2.1 or later.)_

[Ion-schema-schemas](https://github.com/amzn/ion-schema-schemas) has Ion schemas that describe a valid Ion schema.
These schemas can be used to help validate your own schemas as part of your build process.

Here is an example automated test using Kotlin and JUnit4.

```kotlin
import com.amazon.ion.system.IonSystemBuilder
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.io.File

@RunWith(Parameterized::class)
class MySchemasTest(val file: File) {

    companion object {
        private val ION = IonSystemBuilder.standard().build()
        private val ISS = IonSchemaSystemBuilder.standard()
            .withIonSystem(ION)
            .withAuthority(ResourceAuthority.forIonSchemaSchemas())
            .build()
        private val schemaType = ISS.loadSchema("isl/schema.isl").getType("schema")!!

        @JvmStatic
        @Parameterized.Parameters(name = "{0} is syntactically valid")
        fun getSchemas(): Iterable<Array<out Any>> = File("my-schemas-base-directory/").walk()
            .filter { it.isFile && it.path.endsWith(".isl") }
            .map { arrayOf(it) }
            .asIterable()
    }

    @Test
    fun testSchema() {
        val mySchemaIon = ION.loader.load(file)
        val violations = schemaType.validate(mySchemaIon)
        Assert.assertTrue(violations.toString(), violations.isValid())
    }
}
```

_Note—there are some problems, such as duplicate type names or unresolvable imports, that cannot be caught by the Ion Schema schemas._
