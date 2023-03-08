NAMES	:= describe histogram scatter pair_plot logreg_train logreg_predict

all:	$(NAMES)

predict:	logreg_predict
	node logreg_predict.js datasets/dataset_test.csv

train:	logreg_train
	node logreg_train.js datasets/dataset_train.csv

pp:		pair_plot
	node pair_plot.js datasets/dataset_train.csv

describe:
	tsc $@.ts

histogram:
	tsc $@.ts

scatter:
	tsc $@.ts

pair_plot:
	tsc $@.ts

logreg_train:
	tsc $@.ts

logreg_predict:
	tsc $@.ts

svg:
	tsc $@.ts

clean:
	rm -rf *.js
