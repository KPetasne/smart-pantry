--
-- PostgreSQL database dump
--

\restrict 5FIg0IbRNFGcfhsI84goA4vTLemzMhh41RzNPSQwKwbTZsqJBfeHGhiLbJQ4an6

-- Dumped from database version 18.1 (Postgres.app)
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: kevinpetasne
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_users OWNER TO kevinpetasne;

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: kevinpetasne
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO kevinpetasne;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kevinpetasne
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: kevinpetasne
--

CREATE TABLE public.ingredients (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ingredients OWNER TO kevinpetasne;

--
-- Name: ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: kevinpetasne
--

CREATE SEQUENCE public.ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredients_id_seq OWNER TO kevinpetasne;

--
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kevinpetasne
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: kevinpetasne
--

CREATE TABLE public.recipe_ingredients (
    recipe_id integer NOT NULL,
    ingredient_id integer NOT NULL
);


ALTER TABLE public.recipe_ingredients OWNER TO kevinpetasne;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: kevinpetasne
--

CREATE TABLE public.recipes (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    instructions jsonb NOT NULL,
    difficulty character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    language character varying(5) DEFAULT 'es'::character varying NOT NULL,
    country character varying(50) DEFAULT 'argentina'::character varying NOT NULL,
    CONSTRAINT recipes_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[])))
);


ALTER TABLE public.recipes OWNER TO kevinpetasne;

--
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: kevinpetasne
--

CREATE SEQUENCE public.recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipes_id_seq OWNER TO kevinpetasne;

--
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kevinpetasne
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- Name: search_analytics; Type: TABLE; Schema: public; Owner: kevinpetasne
--

CREATE TABLE public.search_analytics (
    id integer NOT NULL,
    ingredients jsonb NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.search_analytics OWNER TO kevinpetasne;

--
-- Name: search_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: kevinpetasne
--

CREATE SEQUENCE public.search_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.search_analytics_id_seq OWNER TO kevinpetasne;

--
-- Name: search_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kevinpetasne
--

ALTER SEQUENCE public.search_analytics_id_seq OWNED BY public.search_analytics.id;


--
-- Name: search_leads; Type: TABLE; Schema: public; Owner: kevinpetasne
--

CREATE TABLE public.search_leads (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.search_leads OWNER TO kevinpetasne;

--
-- Name: search_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: kevinpetasne
--

CREATE SEQUENCE public.search_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.search_leads_id_seq OWNER TO kevinpetasne;

--
-- Name: search_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kevinpetasne
--

ALTER SEQUENCE public.search_leads_id_seq OWNED BY public.search_leads.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- Name: search_analytics id; Type: DEFAULT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.search_analytics ALTER COLUMN id SET DEFAULT nextval('public.search_analytics_id_seq'::regclass);


--
-- Name: search_leads id; Type: DEFAULT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.search_leads ALTER COLUMN id SET DEFAULT nextval('public.search_leads_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: kevinpetasne
--

COPY public.admin_users (id, username, password_hash, created_at) FROM stdin;
1	Oddie	$2b$12$BOyfLDIke1z2VfTxk0OdVerhH8WTbqCJz.ryG8I1Xmj1KzNgXc8si	2026-01-11 17:45:13.879081
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: kevinpetasne
--

COPY public.ingredients (id, name, created_at) FROM stdin;
338	2 pechugas de pollo deshuesadas y sin piel cortadas en cubos de 25 cm	2026-01-10 19:26:51.883827
339	14 taza de salsa de soja	2026-01-10 19:26:51.892388
340	14 taza de mirin vino de arroz dulce	2026-01-10 19:26:51.895558
341	2 cucharadas de sake opcional	2026-01-10 19:26:51.899014
342	2 cucharadas de azcar	2026-01-10 19:26:51.901933
343	1 cucharadita de jengibre rallado fresco	2026-01-10 19:26:51.90502
344	1 diente de ajo picado	2026-01-10 19:26:51.907985
345	1 cucharada de aceite vegetal	2026-01-10 19:26:51.910975
346	semillas de ssamo tostadas para decorar	2026-01-10 19:26:51.913837
347	cebolleta picada para decorar	2026-01-10 19:26:51.916768
348	1 kg de patatas aproximadamente 34 patatas medianas	2026-01-10 19:34:22.826586
349	1 cebolla grande opcional pero muy comn	2026-01-10 19:34:22.83014
350	68 huevos grandes	2026-01-10 19:34:22.832403
351	aceite de oliva virgen extra cantidad generosa para frer	2026-01-10 19:34:22.8345
352	sal al gusto	2026-01-10 19:34:22.836474
353	para el caldo tonkotsu aproximadamente 34 litros	2026-01-10 19:34:28.386458
354	15 kg de huesos de cerdo fmur espinazo o costillas	2026-01-10 19:34:28.390276
355	500g de tocino de cerdo fresco con piel opcional para mayor emulsin	2026-01-10 19:34:28.393619
356	1 cebolla grande cortada en cuartos	2026-01-10 19:34:28.396728
357	1 trozo de jengibre fresco aprox 5 cm en rodajas	2026-01-10 19:34:28.399894
358	34 dientes de ajo aplastados	2026-01-10 19:34:28.403222
359	agua suficiente para cubrir	2026-01-10 19:34:28.406275
360	para el chashu panceta de cerdo marinada	2026-01-10 19:34:28.408668
361	500g de panceta de cerdo fresca enrollada y atada	2026-01-10 19:34:28.410421
362	100 ml de salsa de soja	2026-01-10 19:34:28.412035
363	50 ml de mirin	2026-01-10 19:34:28.413718
364	50 ml de sake vino de arroz japons	2026-01-10 19:34:28.415289
365	1 trozo pequeo de jengibre en rodajas	2026-01-10 19:34:28.417929
366	2 dientes de ajo aplastados	2026-01-10 19:34:28.41949
367	agua	2026-01-10 19:34:28.421029
368	para el tare base de sabor concentrado por tazn	2026-01-10 19:34:28.422631
369	2 cucharadas de salsa de soja	2026-01-10 19:34:28.42414
370	1 cucharada de mirin	2026-01-10 19:34:28.42603
371	1 cucharada de sake	2026-01-10 19:34:28.427674
372	12 cucharadita de aceite de ssamo opcional	2026-01-10 19:34:28.429143
373	una pizca de azcar	2026-01-10 19:34:28.430667
374	para los fideos y toppings por porcin	2026-01-10 19:34:28.432159
375	100120g de fideos para ramen frescos o secos	2026-01-10 19:34:28.433724
376	1 huevo cocido ajitama huevo marinado ver instrucciones	2026-01-10 19:34:28.435268
377	23 rodajas de chashu	2026-01-10 19:34:28.436823
378	cebolleta fresca picada finamente	2026-01-10 19:34:28.438359
379	brotes de bamb menma al gusto	2026-01-10 19:34:28.440289
380	1 lmina de alga nori	2026-01-10 19:34:28.441822
381	aceite de chile rayu o aceite de ajo mayu opcional	2026-01-10 19:34:28.443161
382	320 g spaghetti de buena calidad	2026-01-10 19:34:42.02647
383	150 g guanciale papada de cerdo curada	2026-01-10 19:34:42.030566
384	3 yemas de huevo grandes	2026-01-10 19:34:42.033619
385	1 huevo entero grande	2026-01-10 19:34:42.036545
386	60 g queso pecorino romano dop rallado finamente y un poco ms para servir	2026-01-10 19:34:42.038956
387	pimienta negra recin molida al gusto	2026-01-10 19:34:42.041559
388	sal gruesa para el agua de coccin de la pasta	2026-01-10 19:34:42.043898
389	2 tazas aprox 225g de macarrones de codo o pasta pequea similar	2026-01-10 19:34:44.96959
390	14 taza aprox 55g de mantequilla sin sal	2026-01-10 19:34:44.972618
391	14 taza aprox 30g de harina de trigo todo uso	2026-01-10 19:34:44.976009
392	3 tazas aprox 720ml de leche entera	2026-01-10 19:34:44.979344
393	34 tazas aprox 300400g de queso cheddar fuerte rallado	2026-01-10 19:34:44.984411
394	12 cucharadita de sal o al gusto	2026-01-10 19:34:44.986292
395	14 cucharadita de pimienta negra molida	2026-01-10 19:34:44.988072
396	12 cucharadita de mostaza en polvo opcional realza el sabor del queso	2026-01-10 19:34:44.990015
397	1 pizca de pimienta cayena opcional para un toque picante sutil	2026-01-10 19:34:44.992056
398	1 kg tomates maduros tipo pera o rama	2026-01-10 19:34:59.230361
399	1 pimiento verde italiano	2026-01-10 19:34:59.233254
400	1 pepino mediano	2026-01-10 19:34:59.235205
401	1 diente de ajo pequeo o al gusto sin el germen central si no te gusta fuerte	2026-01-10 19:34:59.237592
402	50g pan blanco duro opcional sin corteza	2026-01-10 19:34:59.2405
403	100 ml aceite de oliva virgen extra	2026-01-10 19:34:59.242977
404	30 ml vinagre de jerez o al gusto	2026-01-10 19:34:59.245972
405	200 ml agua muy fra o ms al gusto	2026-01-10 19:34:59.248864
406	1 kg de papas patatas harinosas	2026-01-10 19:35:00.846007
407	500g de carne picada molida de vaca roast beef o similar	2026-01-10 19:35:00.849356
409	1 morrn pimiento rojo	2026-01-10 19:35:00.855522
411	2 huevos duros picados	2026-01-10 19:35:00.861675
412	100g de aceitunas verdes descarozadas picadas	2026-01-10 19:35:00.864764
413	100g de manteca mantequilla	2026-01-10 19:35:00.867917
414	100 ml de leche caliente	2026-01-10 19:35:00.869869
415	100g de queso rallado parmesan sardo o reggianito	2026-01-10 19:35:00.871522
416	aceite vegetal para rehogar	2026-01-10 19:35:00.873162
417	1 cucharadita de comino molido	2026-01-10 19:35:00.87689
418	1 cucharada de pimentn dulce	2026-01-10 19:35:00.878478
419	12 cucharadita de aj molido opcional para un toque picante	2026-01-10 19:35:00.880099
420	1 cucharadita de organo seco	2026-01-10 19:35:00.881647
421	nuez moscada recin rallada al gusto	2026-01-10 19:35:00.883219
422	2 pechugas de pollo	2026-01-10 19:35:19.860373
423	1 cebolla roja grande picada finamente	2026-01-10 19:35:19.863012
424	3 dientes de ajo picados o molidos	2026-01-10 19:35:19.864773
425	12 taza de pasta de aj amarillo o 45 ajes amarillos frescos licuados	2026-01-10 19:35:19.866959
426	6 rebanadas de pan de molde sin corteza	2026-01-10 19:35:19.869395
427	12 taza de leche evaporada	2026-01-10 19:35:19.873109
428	12 taza de caldo de pollo de la coccin del pollo	2026-01-10 19:35:19.875119
429	50g de queso parmesano rallado opcional para un toque cremoso	2026-01-10 19:35:19.877502
430	50g de nueces picadas opcional para textura y sabor	2026-01-10 19:35:19.878965
431	aceite vegetal	2026-01-10 19:35:19.880397
432	sal y pimienta al gusto	2026-01-10 19:35:19.881815
433	para servir y decorar	2026-01-10 19:35:19.884947
434	arroz blanco cocido	2026-01-10 19:35:19.886714
435	2 papas amarillas cocidas peladas y cortadas en rodajas opcional	2026-01-10 19:35:19.888202
436	2 huevos duros cortados en cuartos	2026-01-10 19:35:19.889551
437	46 aceitunas negras de botija	2026-01-10 19:35:19.89123
408	2 cebollas grandes	2026-01-10 19:35:00.852448
410	2 dientes de ajo	2026-01-10 19:35:00.858748
438	15 kg de pollo pueden ser pechugas muslos o una mezcla deshuesados y sin piel	2026-01-10 19:38:04.588352
439	2 kg de papas grandes	2026-01-10 19:38:04.592316
441	1 morrn rojo grande	2026-01-10 19:38:04.597218
443	400g de tomate perita en cubos una lata	2026-01-10 19:38:04.601445
444	100g de aceitunas verdes descarozadas	2026-01-10 19:38:04.603741
445	3 huevos duros	2026-01-10 19:38:04.606063
446	100g de queso rallado tipo parmesano o sardo	2026-01-10 19:38:04.608139
447	50g de manteca	2026-01-10 19:38:04.61052
448	100ml de leche tibia	2026-01-10 19:38:04.612721
449	aceite de girasol	2026-01-10 19:38:04.614797
450	sal	2026-01-10 19:38:04.616964
451	pimienta	2026-01-10 19:38:04.619343
452	pimentn dulce	2026-01-10 19:38:04.621353
453	organo	2026-01-10 19:38:04.623403
454	comino opcional	2026-01-10 19:38:04.625163
455	caldo de verdura o pollo aproximadamente 200ml si es necesario	2026-01-10 19:38:04.627096
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: kevinpetasne
--

COPY public.recipe_ingredients (recipe_id, ingredient_id) FROM stdin;
36	338
36	339
36	340
36	341
36	342
36	343
36	344
36	345
36	346
36	347
38	348
38	349
38	350
38	351
38	352
39	353
39	354
39	355
39	356
39	357
39	358
39	359
39	360
39	361
39	362
39	363
39	364
39	342
39	365
39	366
39	367
39	368
39	369
39	370
39	371
39	372
39	373
39	374
39	375
39	376
39	377
39	378
39	379
39	380
39	381
40	382
40	383
40	384
40	385
40	386
40	387
40	388
41	389
41	390
41	391
41	392
41	393
41	394
41	395
41	396
41	397
42	398
42	399
42	400
42	401
42	402
42	403
42	404
42	405
42	352
43	406
43	407
43	408
43	409
43	410
43	411
43	412
43	413
43	414
43	415
43	416
43	352
43	387
43	417
43	418
43	419
43	420
43	421
44	422
44	423
44	424
44	425
44	426
44	427
44	428
44	429
44	430
44	431
44	432
44	433
44	434
44	435
44	436
44	437
45	438
45	439
45	408
45	441
45	410
45	443
45	444
45	445
45	446
45	447
45	448
45	449
45	450
45	451
45	452
45	453
45	454
45	455
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: kevinpetasne
--

COPY public.recipes (id, title, instructions, difficulty, created_at, language, country) FROM stdin;
36	Pollo Teriyaki	["En un tazón pequeño, mezcla la salsa de soja, el mirin, el sake (si lo usas), el azúcar, el jengibre rallado y el ajo picado. Bate bien hasta que el azúcar se disuelva.", "Agrega los cubos de pollo a la marinada y asegúrate de que queden bien cubiertos. Tapa el tazón y refrigera durante al menos 30 minutos, o hasta por 2 horas.", "Calienta el aceite vegetal en una sartén grande o wok a fuego medio-alto.", "Retira el pollo de la marinada, desechando la marinada sobrante.", "Cocina el pollo en la sartén caliente, revolviendo ocasionalmente, hasta que esté dorado por todos lados y completamente cocido (aproximadamente 6-8 minutos).", "Sirve el pollo teriyaki caliente, adornado con semillas de sésamo tostadas y cebolleta picada. Es delicioso servido con arroz blanco al vapor."]	easy	2026-01-10 19:26:51.87161	es	japan
37	Apple Pie (Pastel de Manzana Clásico)	["Precalienta el horno a 425°F (220°C).", "En un tazón grande, mezcla las rodajas de manzana con la harina, el azúcar granulada, el azúcar moreno, la canela, la nuez moscada y la sal. Revuelve bien para cubrir uniformemente las manzanas.", "Coloca un disco de masa para pastel en el fondo de un molde para pastel de 9 pulgadas. Presiona la masa hacia el fondo y los lados del molde.", "Vierte la mezcla de manzana en la masa preparada. Coloca los cubos de mantequilla de manera uniforme sobre las manzanas.", "Coloca el segundo disco de masa para pastel sobre el relleno de manzana. Recorta el exceso de masa y sella los bordes pellizcándolos juntos. Haz varios cortes en la parte superior de la masa para permitir que el vapor escape.", "Pincela la parte superior de la masa con el glaseado de huevo. Esto le dará un brillo dorado al pastel.", "Hornea durante 15 minutos a 425°F (220°C).", "Reduce la temperatura del horno a 375°F (190°C) y continúa horneando durante 35-45 minutos más, o hasta que la corteza esté dorada y el relleno de manzana burbujee.", "Si la corteza comienza a dorarse demasiado pronto, puedes cubrir los bordes con papel de aluminio.", "Deja enfriar completamente el pastel sobre una rejilla antes de servir. Esto permitirá que el relleno se asiente."]	medium	2026-01-10 19:27:00.267198	es	usa
38	Tortilla de Patatas Clásica (Tortilla Española)	["Pela las patatas y córtalas en láminas finas o en trozos irregulares pequeños (como patatas fritas gruesas). Si usas cebolla, pélala y córtala en juliana fina.", "En una sartén grande y profunda (preferiblemente antiadherente), calienta una cantidad generosa de aceite de oliva (que cubra el fondo y llegue a la mitad de las patatas). Añade las patatas (y la cebolla, si la usas) y una buena pizca de sal.", "Cocina a fuego medio-bajo, removiendo ocasionalmente, hasta que las patatas estén muy tiernas y blandas, casi confitadas, pero sin que se doren ni queden crujientes. Este proceso puede llevar de 20 a 30 minutos.", "Una vez que las patatas estén tiernas, retíralas de la sartén con una espumadera, escurriendo el exceso de aceite, y transfiérelas a un bol grande. Puedes reservar un poco del aceite colado para el último paso.", "En un bol aparte, bate los huevos vigorosamente con otra pizca de sal.", "Añade las patatas (y cebolla) al bol con los huevos batidos. Mezcla bien y deja reposar durante unos 5-10 minutos para que las patatas absorban bien el huevo.", "Vierte la mayor parte del aceite de la sartén (si queda mucho), dejando solo una fina capa (unas 1-2 cucharadas). Calienta la sartén a fuego medio-alto.", "Vierte la mezcla de patata y huevo en la sartén caliente. Distribúyela uniformemente y presiona ligeramente con una espátula para darle forma. Cocina durante unos 5-7 minutos, moviendo la sartén ocasionalmente para evitar que se pegue. Los bordes deben empezar a cuajarse y la base debe estar dorada.", "Para darle la vuelta a la tortilla: Coloca un plato grande y plano sobre la sartén. Con decisión y rapidez, invierte la sartén sobre el plato. La tortilla debería deslizarse sobre el plato con la parte cocida hacia arriba.", "Desliza la tortilla de nuevo a la sartén (con la parte sin cocinar hacia abajo). Con la espátula, redondea los bordes para darle una forma bonita.", "Cocina durante otros 3-5 minutos, o hasta que la tortilla esté hecha a tu gusto (más o menos cuajada por dentro).", "Desliza la tortilla terminada a un plato de servir. Déjala enfriar ligeramente antes de cortarla y servirla. Se puede disfrutar tibia o a temperatura ambiente."]	medium	2026-01-10 19:34:22.817985	es	spain
39	Ramen Tonkotsu Casero	["**1. Preparar el Caldo Tonkotsu (12-18 horas):**", "Lavar bien los huesos y el tocino de cerdo. Blanquearlos en agua hirviendo durante 15 minutos. Desechar el agua, limpiar cualquier impureza de los huesos y el tocino con agua fría. Esto asegura un caldo limpio.", "Colocar los huesos y el tocino limpios en una olla grande. Cubrir completamente con agua fresca. Añadir la cebolla, el jengibre y los ajos.", "Llevar a ebullición a fuego fuerte, luego reducir el fuego a muy bajo y cocinar a fuego lento, sin tapa, durante al menos 12 a 18 horas. El objetivo es que el caldo emulsione y se vuelva blanco y cremoso. Remover y espumar ocasionalmente.", "Una vez el caldo esté listo, colar todas las impurezas y los huesos. Reservar el caldo. Si se usó tocino, se puede retirar y usar para otros fines o desechar.", "**2. Preparar el Chashu (1.5-2 horas):**", "En una olla, combinar la salsa de soja, mirin, sake, azúcar, jengibre y ajo con suficiente agua para cubrir la panceta de cerdo enrollada. Llevar a ebullición.", "Añadir la panceta de cerdo. Reducir el fuego a bajo y cocinar a fuego lento durante 1.5 a 2 horas, o hasta que la carne esté muy tierna. Girar la panceta cada 30 minutos para una cocción uniforme.", "Retirar la panceta de la olla y dejar enfriar completamente. Se puede prensar ligeramente para darle forma. Una vez fría, cortar en rodajas finas de aproximadamente 0.5 cm.", "**3. Preparar los Huevos Ajitama (Recomendado, idealmente 4-6 horas o toda la noche):**", "Cocinar los huevos a fuego suave durante 6.5 a 7 minutos para obtener una yema líquida. Enfriar inmediatamente en un baño de hielo y pelar con cuidado.", "Preparar una marinada con partes iguales de salsa de soja, mirin y agua (o parte del líquido de cocción del Chashu). Sumergir los huevos pelados y marinar en el refrigerador durante al menos 4-6 horas, o idealmente toda la noche.", "**4. Preparar el Tare (Justo antes de servir):**", "En un bol pequeño, mezclar la salsa de soja, mirin, sake, aceite de sésamo y una pizca de azúcar. Esta será la base de sabor para cada tazón de ramen.", "**5. Montar el Ramen:**", "Cocinar los fideos para ramen según las instrucciones del paquete. Deben estar al dente. Escurrir bien.", "Mientras se cocinan los fideos, calentar el caldo Tonkotsu.", "En cada tazón de ramen, añadir 2-3 cucharadas del Tare preparado.", "Verter aproximadamente 300-400 ml de caldo Tonkotsu muy caliente sobre el Tare en cada tazón y mezclar bien.", "Añadir los fideos cocidos al tazón.", "Disponer los toppings cuidadosamente: 2-3 rodajas de Chashu, medio huevo Ajitama, una generosa cantidad de cebolleta picada, brotes de bambú y una lámina de nori.", "Servir inmediatamente y disfrutar. Opcionalmente, se puede añadir un poco de aceite de chile (rayu) o aceite de ajo (mayu) para un toque extra de sabor."]	hard	2026-01-10 19:34:28.378822	es	japan
40	Spaghetti Carbonara Auténtica	["**Preparar el Guanciale:** Cortar el guanciale en tiras de aproximadamente 0.5 cm de grosor o en cubos pequeños. Calentar una sartén a fuego medio-bajo y añadir el guanciale. Cocinar lentamente, sin añadir aceite, hasta que esté crujiente y haya soltado gran parte de su grasa. Retirar el guanciale de la sartén con una espumadera y reservar. Dejar la grasa del guanciale en la sartén.", "**Preparar la Mezcla de Huevo y Queso:** En un bol grande, batir las yemas de huevo y el huevo entero con un tenedor. Añadir el queso Pecorino Romano rallado y una buena cantidad de pimienta negra recién molida. Mezclar bien hasta obtener una crema homogénea. Si la mezcla está demasiado espesa, se puede añadir una cucharada del agua de cocción de la pasta más adelante.", "**Cocinar la Pasta:** Poner a hervir abundante agua en una olla grande. Cuando hierva, añadir una cucharada de sal gruesa. Añadir los spaghetti y cocinarlos según las instrucciones del paquete hasta que estén al dente. Antes de escurrir, reservar aproximadamente 1-2 tazas del agua de cocción de la pasta.", "**Emulsionar la Salsa:** Una vez que la pasta esté al dente, escurrirla rápidamente (sin enfriar) y añadirla directamente a la sartén donde se cocinó el guanciale, con la grasa aún caliente. Remover para que la pasta se impregne de la grasa.", "**Montar la Carbonara:** Retirar la sartén del fuego. Añadir la mezcla de huevo y queso a la pasta y remover rápidamente y sin parar. Es crucial que la sartén no esté sobre el fuego para evitar que el huevo se cueza y se convierta en revuelto. Añadir poco a poco agua de cocción de la pasta reservada, una o dos cucharadas a la vez, mientras se sigue removiendo vigorosamente. Esto ayudará a crear una salsa cremosa y emulsionada que se adherirá a la pasta. La clave es el calor residual de la pasta y la sartén.", "**Servir:** Añadir la mayor parte del guanciale crujiente a la pasta y remover. Servir inmediatamente en platos precalentados. Espolvorear con más Pecorino Romano rallado, una pizca adicional de pimienta negra recién molida y el resto del guanciale crujiente por encima."]	medium	2026-01-10 19:34:42.020125	es	italy
41	Mac and Cheese Clásico	["1. Cocina la pasta: En una olla grande con agua hirviendo y sal, cocina los macarrones según las instrucciones del paquete hasta que estén al dente. Escurre bien y reserva.", "2. Prepara el roux: En una olla grande o cacerola a fuego medio, derrite la mantequilla. Agrega la harina y bate constantemente durante 1-2 minutos para formar un roux ligero. No dejes que se dore.", "3. Haz la salsa: Vierte gradualmente la leche, batiendo continuamente para evitar grumos. Cocina, sin dejar de batir, hasta que la salsa espese y hierva suavemente (aproximadamente 5-7 minutos).", "4. Añade el queso y sazona: Retira la olla del fuego. Incorpora la sal, la pimienta negra, la mostaza en polvo y la cayena (si las usas). Agrega el queso cheddar rallado poco a poco, batiendo hasta que cada adición se derrita completamente antes de añadir más. La salsa debe quedar suave y homogénea.", "5. Combina y sirve: Añade los macarrones cocidos a la salsa de queso y mezcla bien hasta que estén completamente cubiertos. Sirve inmediatamente."]	medium	2026-01-10 19:34:44.965695	es	usa
42	Gazpacho Andaluz	["Lava bien los tomates, el pimiento y el pepino. Trocea los tomates. Retira las semillas y el tallo del pimiento y córtalo en trozos grandes. Pela el pepino y también trocéalo. Pela el diente de ajo.", "Si utilizas pan, remójalo en un poco de agua fría por unos minutos y luego escúrrelo ligeramente.", "En una batidora de vaso grande o un recipiente alto para batidora de mano, introduce los tomates, el pimiento, el pepino, el ajo y el pan remojado (si lo usas).", "Añade el aceite de oliva virgen extra, el vinagre de Jerez y una pizca de sal.", "Tritura todos los ingredientes a máxima potencia hasta obtener una mezcla muy fina y homogénea. Cuanto más tiempo batas, más fina será la textura. Si prefieres un gazpacho menos denso, puedes añadir un poco más de agua fría en este punto.", "Prueba el gazpacho y ajusta la sal, el vinagre o el aceite si es necesario. Si lo deseas más líquido, añade agua fría poco a poco hasta conseguir la consistencia deseada.", "Para una textura aún más suave y sin pieles ni pepitas, pasa el gazpacho por un colador fino o chino, ayudándote con una cuchara de madera. Este paso es opcional, pero tradicional para un acabado impecable.", "Refrigera el gazpacho durante al menos 2-3 horas antes de servir, o hasta que esté muy frío. Es fundamental que se sirva helado.", "Sirve el gazpacho en vasos o cuencos. Opcionalmente, puedes acompañarlo con una guarnición de pepino, pimiento verde o cebolla roja picados finamente, y unos picatostes."]	easy	2026-01-10 19:34:59.221665	es	spain
43	Pastel de Papa Clásico	["Precalentar el horno a 180°C (350°F).", "**Para el puré de papas:** Pelar las papas, cortarlas en trozos parejos y hervirlas en agua con sal hasta que estén muy tiernas. Escurrirlas completamente.", "Pisar las papas calientes con un pisapapas o tenedor. Agregar la manteca, la leche caliente, sal, pimienta y nuez moscada. Mezclar hasta obtener un puré suave y cremoso. Reservar.", "**Para el relleno de carne (pino):** Picar las cebollas y el morrón en brunoise (cubos pequeños). Picar finamente los dientes de ajo.", "En una sartén grande o cacerola, calentar un chorro de aceite vegetal a fuego medio. Rehogar las cebollas y el morrón hasta que estén transparentes y tiernas, unos 8-10 minutos. Añadir el ajo picado y cocinar por un minuto más hasta que esté fragante.", "Incorporar la carne picada a la sartén. Romperla con una cuchara de madera y cocinar hasta que esté dorada por completo. Si acumula mucha grasa, escurrir el exceso.", "Condimentar la carne con sal, pimienta, comino, pimentón dulce y ají molido (si se usa). Cocinar por 5 minutos más para que los sabores se integren. Retirar del fuego.", "Añadir los huevos duros picados y las aceitunas picadas al relleno de carne. Mezclar bien y probar para ajustar la sazón si es necesario.", "**Para el armado:** En una fuente apta para horno (aproximadamente 20x30 cm) previamente engrasada, extender el relleno de carne de manera uniforme en la base.", "Cubrir cuidadosamente el relleno de carne con el puré de papas, extendiéndolo de forma pareja. Se puede usar un tenedor para crear un diseño rústico en la superficie del puré.", "Espolvorear generosamente con el queso rallado por encima del puré.", "Llevar al horno precalentado y cocinar durante 25-30 minutos, o hasta que la superficie del puré esté dorada y el queso burbujeante. Si es necesario, se puede gratinar los últimos minutos para un mejor dorado.", "Retirar del horno y dejar reposar unos 5-10 minutos antes de servir para que se asiente. Servir caliente."]	medium	2026-01-10 19:35:00.838609	es	argentina
44	Ají de Gallina	["Cocinar el pollo: En una olla con agua y un poco de sal, cocinar las pechugas de pollo hasta que estén tiernas. Retirar el pollo, desmenuzarlo finamente y reservar media taza del caldo de la cocción.", "Remojar el pan: Colocar las rebanadas de pan de molde en un recipiente y cubrirlas con la leche evaporada. Dejar remojar hasta que estén blandas.", "Preparar el aderezo: En una sartén grande a fuego medio, calentar un poco de aceite vegetal. Sofreír la cebolla picada hasta que esté transparente (unos 5-7 minutos). Añadir el ajo molido y cocinar por un minuto más hasta que esté fragante.", "Incorporar el ají amarillo: Agregar la pasta de ají amarillo al aderezo y cocinar por 5-7 minutos, removiendo constantemente, hasta que el color se intensifique y el aceite se separe ligeramente. Es importante cocinar bien el ají para quitarle el sabor crudo.", "Licuar la base (opcional): Si se prefiere una salsa muy fina, se puede licuar el aderezo junto con el pan remojado hasta obtener una crema homogénea. Si no, se puede continuar directamente en la sartén.", "Formar la crema: Añadir el pan remojado y licuado (o desmenuzado con las manos) a la sartén con el aderezo. Mezclar bien. Incorporar el caldo de pollo poco a poco, removiendo constantemente para evitar grumos y lograr una consistencia cremosa y espesa.", "Añadir el pollo y sazonar: Incorporar el pollo desmenuzado a la crema. Si se usa, añadir el queso parmesano y las nueces picadas. Sazonar con sal y pimienta al gusto. Cocinar a fuego bajo por unos minutos más, removiendo ocasionalmente, hasta que la salsa espese un poco y todos los sabores se integren.", "Servir: Servir el Ají de Gallina caliente, acompañado de arroz blanco y, si se desea, rodajas de papa cocida. Decorar cada plato con cuartos de huevo duro y aceitunas negras."]	medium	2026-01-10 19:35:19.856384	es	peru
45	Pastel de Pollo y Papa	["Para el pollo: Hervir el pollo en agua con sal hasta que esté bien cocido (aproximadamente 20-25 minutos). Dejar enfriar, desmenuzar finamente y reservar. Guardar un poco del caldo de cocción.", "Para el relleno: En una olla grande, calentar un chorro generoso de aceite de girasol. Rehogar las cebollas picadas finamente y el morrón rojo picado hasta que estén transparentes y tiernos. Agregar los dientes de ajo picados y cocinar por un minuto más.", "Incorporar el tomate perita en cubos y cocinar a fuego medio durante unos 10-15 minutos, hasta que el tomate se reduzca y los sabores se integren. Condimentar con sal, pimienta, pimentón dulce y orégano. Si la preparación está muy seca, añadir un poco del caldo reservado.", "Sumar el pollo desmenuzado al sofrito. Agregar las aceitunas verdes descarozadas y picadas, y los huevos duros picados. Mezclar bien y cocinar por 5 minutos más para que todos los ingredientes se integren. Rectificar la sazón y reservar.", "Para el puré de papa: Pelar las papas y cortarlas en trozos. Hervirlas en abundante agua con sal hasta que estén bien tiernas. Escurrir completamente el agua.", "Pisar las papas hasta obtener un puré suave. Incorporar la manteca y la leche tibia. Mezclar hasta que quede cremoso. Sazonar con sal y pimienta a gusto.", "Armado del pastel: En una fuente para horno, colocar una primera capa de puré de papa, distribuyendo aproximadamente la mitad del puré y alisando la superficie.", "Extender el relleno de pollo sobre la capa de puré. Cubrir con el resto del puré de papa, alisando la superficie con una espátula o cuchara. Opcionalmente, se puede hacer un dibujo con un tenedor para darle una terminación más vistosa.", "Espolvorear generosamente con queso rallado. Llevar a horno precalentado (medio-fuerte, 180-200°C) por unos 25-30 minutos, o hasta que la superficie esté dorada y el queso gratinado.", "Dejar reposar unos minutos antes de servir para que asienten los sabores y sea más fácil porcionar. ¡A disfrutar de este clásico plato casero!"]	medium	2026-01-10 19:38:04.579142	es	argentina
\.


--
-- Data for Name: search_analytics; Type: TABLE DATA; Schema: public; Owner: kevinpetasne
--

COPY public.search_analytics (id, ingredients, "timestamp") FROM stdin;
1	["honey", "shrimp"]	2026-01-10 18:13:29.646378
2	["pollo"]	2026-01-10 19:38:04.632229
\.


--
-- Data for Name: search_leads; Type: TABLE DATA; Schema: public; Owner: kevinpetasne
--

COPY public.search_leads (id, email, created_at) FROM stdin;
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kevinpetasne
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, true);


--
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kevinpetasne
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 455, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kevinpetasne
--

SELECT pg_catalog.setval('public.recipes_id_seq', 45, true);


--
-- Name: search_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kevinpetasne
--

SELECT pg_catalog.setval('public.search_analytics_id_seq', 2, true);


--
-- Name: search_leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kevinpetasne
--

SELECT pg_catalog.setval('public.search_leads_id_seq', 1, false);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: ingredients ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_name_key UNIQUE (name);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (recipe_id, ingredient_id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: search_analytics search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_pkey PRIMARY KEY (id);


--
-- Name: search_leads search_leads_email_key; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.search_leads
    ADD CONSTRAINT search_leads_email_key UNIQUE (email);


--
-- Name: search_leads search_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.search_leads
    ADD CONSTRAINT search_leads_pkey PRIMARY KEY (id);


--
-- Name: idx_ingredients_name; Type: INDEX; Schema: public; Owner: kevinpetasne
--

CREATE INDEX idx_ingredients_name ON public.ingredients USING btree (name);


--
-- Name: idx_recipe_ingredients_ingredient_id; Type: INDEX; Schema: public; Owner: kevinpetasne
--

CREATE INDEX idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients USING btree (ingredient_id);


--
-- Name: idx_recipe_ingredients_recipe_id; Type: INDEX; Schema: public; Owner: kevinpetasne
--

CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients USING btree (recipe_id);


--
-- Name: idx_recipes_country; Type: INDEX; Schema: public; Owner: kevinpetasne
--

CREATE INDEX idx_recipes_country ON public.recipes USING btree (country);


--
-- Name: idx_recipes_difficulty; Type: INDEX; Schema: public; Owner: kevinpetasne
--

CREATE INDEX idx_recipes_difficulty ON public.recipes USING btree (difficulty);


--
-- Name: idx_recipes_language; Type: INDEX; Schema: public; Owner: kevinpetasne
--

CREATE INDEX idx_recipes_language ON public.recipes USING btree (language);


--
-- Name: idx_search_analytics_timestamp; Type: INDEX; Schema: public; Owner: kevinpetasne
--

CREATE INDEX idx_search_analytics_timestamp ON public.search_analytics USING btree ("timestamp");


--
-- Name: recipe_ingredients recipe_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kevinpetasne
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 5FIg0IbRNFGcfhsI84goA4vTLemzMhh41RzNPSQwKwbTZsqJBfeHGhiLbJQ4an6

